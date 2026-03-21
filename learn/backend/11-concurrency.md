# 11 — Concurrency, Optimistic Locking, and Connection Pooling

## Why concurrency matters

EstiMate is a **multi-user app**. During a sprint planning session, 5–20 people might:

- Join the same session simultaneously
- Cast votes at the same time
- Reveal votes while someone else is still voting

If the backend assumes "one request at a time," things break silently. Two classic problems:

1. **Race conditions** — two threads read the same data, both make a decision, and the last write wins (losing the first one)
2. **Resource exhaustion** — too many concurrent database connections starve subsequent requests

This guide walks through three real concurrency problems we found in EstiMate and how we fixed them.

---

## Problem 1: The TOCTOU race in session code generation

### What is TOCTOU?

**TOCTOU** = Time-of-Check to Time-of-Use. It happens when you:

1. **Check** a condition (e.g., "is this session code taken?")
2. **Use** the result (e.g., "no → insert it")

…but between steps 1 and 2, another thread does the same thing.

### The bug

When a user creates a session, the backend generates a random 6-character code like `ABC123`. The original code checked for uniqueness like this:

```java
// ❌ VULNERABLE — TOCTOU race condition
private String generateUniqueSessionCode() {
    String code;
    do {
        code = generateSessionCode();          // random 6-char code
    } while (sessionRepository.findBySessionCode(code).isPresent());  // CHECK
    return code;                                                       // USE
}
```

This looks correct — keep generating until we find an unused code. But in concurrent traffic:

```
Thread A:  findBySessionCode("XYZ789") → empty ✓    (check)
Thread B:  findBySessionCode("XYZ789") → empty ✓    (check — same code!)
Thread A:  INSERT session_code = "XYZ789" → success  (use)
Thread B:  INSERT session_code = "XYZ789" → 💥 UNIQUE constraint violation
```

Thread B's check passed because Thread A hadn't inserted yet. By the time Thread B inserts, it's too late.

### The fix: retry on collision

The database `UNIQUE` constraint catches what the application-level check missed. Instead of trying to prevent collisions entirely (which requires database-level locks and hurts performance), we **catch and retry**:

```java
// ✅ SAFE — retry on collision
private static final int MAX_CODE_RETRIES = 5;

private Session createSessionWithUniqueCode(CreateSessionRequest request) {
    for (int attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
        try {
            Session session = buildSession(request);      // generates a fresh code
            return sessionRepository.save(session);       // INSERT — may collide
        } catch (DataIntegrityViolationException e) {
            if (attempt == MAX_CODE_RETRIES - 1) {
                throw new IllegalStateException(
                    "Unable to generate a unique session code after "
                    + MAX_CODE_RETRIES + " attempts", e);
            }
            log.warn("Session code collision on attempt {}, retrying", attempt + 1);
        }
    }
    throw new IllegalStateException("Failed to generate unique session code");
}
```

**Key insight**: the `UNIQUE` database constraint is the real safeguard. The application-level `findBySessionCode` check is an *optimization* (avoids unnecessary constraint violations most of the time), but the retry loop handles the rare collision gracefully.

### Why not use a database-level lock?

You *could* use `SELECT ... FOR UPDATE` or a pessimistic lock to prevent collisions entirely. But for session code generation:

- Collisions are **extremely rare** (36^6 = 2.1 billion possible codes)
- Locking **serializes** all session creation (one at a time)
- Retrying is **faster** for the common case (no collision, no lock overhead)

> **Rule of thumb**: use *optimistic* strategies (try and retry) when conflicts are rare. Use *pessimistic* locks when conflicts are frequent and retrying is expensive.

### Related files

- `SessionServiceImpl.java` → `createSessionWithUniqueCode()`
- `V1__initial_schema.sql` → `session_code VARCHAR(6) NOT NULL UNIQUE`

---

## Problem 2: Lost updates — the need for optimistic locking

### What is a lost update?

Imagine two moderators (in different browser tabs) both update session settings at the same time:

```
Moderator Tab A:  reads session (version 1) — timer = OFF
Moderator Tab B:  reads session (version 1) — timer = OFF
Tab A:            sets timer = ON, saves → version 1 + timer ON → success
Tab B:            sets auto-reveal = ON, saves → version 1 + auto-reveal ON → success
                  ⚠ Tab B's save overwrites Tab A's timer change!
```

Both writes succeed, but Tab A's "timer ON" change is lost. This is a **lost update**.

### The fix: `@Version`

JPA provides **optimistic locking** via a version column:

```java
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version                    // ← JPA manages this automatically
    private Long version;

    // ... other fields
}
```

How it works:

1. When Hibernate reads a Session, it notes the `version` (e.g., `1`)
2. When it writes, it adds `WHERE version = 1` to the UPDATE
3. If another thread already incremented the version to `2`, the UPDATE affects 0 rows
4. Hibernate throws `OptimisticLockException`

```sql
-- What Hibernate generates:
UPDATE sessions
SET    name = 'Sprint 1', votes_revealed = true, version = 2
WHERE  id = 42 AND version = 1;
--                 ^^^^^^^^^ this fails if someone else already updated
```

Now the lost-update scenario becomes:

```
Tab A:  reads session (version 1)
Tab B:  reads session (version 1)
Tab A:  UPDATE ... WHERE version = 1 → success, version is now 2
Tab B:  UPDATE ... WHERE version = 1 → 0 rows updated → OptimisticLockException ✋
```

Tab B gets an error and can re-read the latest state before retrying.

### When to choose optimistic vs. pessimistic locking

| | Optimistic (`@Version`) | Pessimistic (`@Lock`) |
|---|---|---|
| **How** | Check version at write time | Lock rows at read time |
| **Blocks threads?** | No — fails fast on conflict | Yes — waits for lock release |
| **Best for** | Low contention (rare conflicts) | High contention (frequent conflicts) |
| **EstiMate use case** | Session updates (rare conflicts) | — |

Planning poker sessions typically have **one moderator** making changes, so conflicts are rare → optimistic locking is the right choice.

### The Flyway migration

```sql
-- V2__add_session_version.sql
ALTER TABLE sessions ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
```

### Related files

- `Session.java` → `@Version private Long version`
- `V2__add_session_version.sql` → adds the column to PostgreSQL

---

## Problem 3: Connection pool exhaustion

### What is a connection pool?

Opening a database connection is expensive (~5–50ms). A **connection pool** keeps a set of open connections ready to reuse:

```
Request 1 → borrows connection → runs query → returns connection
Request 2 → borrows connection → runs query → returns connection
Request 3 → no connection available → WAITS (up to timeout)
```

Spring Boot uses **HikariCP** — the fastest Java connection pool.

### Default settings are dangerous in production

By default, HikariCP allows only **10 connections**. With 20 concurrent users each creating sessions, joining, and voting, you'll run out quickly:

```
Connection 1:  session creation (Thread A)
Connection 2:  join session (Thread B)
...
Connection 10: vote cast (Thread J)
Connection 11: ⏳ waits 30 seconds... → ConnectionTimeoutException 💥
```

### The fix: explicit pool configuration

```properties
# application-prod.properties

# ── HikariCP Connection Pool ────────────────────────────────────────
spring.datasource.hikari.maximum-pool-size=${HIKARI_MAX_POOL_SIZE:20}
spring.datasource.hikari.minimum-idle=${HIKARI_MIN_IDLE:5}
spring.datasource.hikari.connection-timeout=30000    # 30s — max wait for a connection
spring.datasource.hikari.idle-timeout=600000         # 10min — close idle connections
spring.datasource.hikari.max-lifetime=1800000        # 30min — recycle connections
```

| Setting | Default | Our value | Why |
|---------|---------|-----------|-----|
| `maximum-pool-size` | 10 | 20 | Supports 20 concurrent DB operations |
| `minimum-idle` | same as max | 5 | Don't hold unused connections |
| `connection-timeout` | 30s | 30s | Fail fast rather than hang |
| `idle-timeout` | 10min | 10min | Clean up unused connections |
| `max-lifetime` | 30min | 30min | Prevent stale connections |

### How to choose `maximum-pool-size`

A common formula:

```
pool-size = (core_count * 2) + effective_spindle_count
```

For a **cloud PostgreSQL** instance (SSD, no spindles):
- 2 CPU cores → (2 × 2) + 1 = **5**
- 4 CPU cores → (4 × 2) + 1 = **9**

We chose 20 as an environment-overridable default via `HIKARI_MAX_POOL_SIZE`. You can tune it for your deployment.

> ⚠️ **More connections ≠ better.** Each connection uses server memory. Too many connections can overwhelm the database and slow everything down. Start small and increase based on monitoring.

### Why H2 doesn't need this

In development, EstiMate uses H2 (an in-memory database embedded in the JVM). There's no network hop, so connections are nearly instant and pool pressure is low. The HikariCP settings only live in `application-prod.properties`.

### Related files

- `application-prod.properties` → HikariCP configuration

---

## The `@Transactional` annotation

You'll notice `@Transactional` on `SessionServiceImpl`:

```java
@Service
@Transactional              // ← all public methods run inside a DB transaction
public class SessionServiceImpl {
    // ...
}
```

This means every public method:
1. **Begins** a transaction before executing
2. **Commits** if the method returns normally
3. **Rolls back** if an unchecked exception is thrown

Without `@Transactional`, the session creation flow (save session → save moderator → update moderator ID) could leave partial data if step 2 fails.

### Transaction and retry gotcha

When `DataIntegrityViolationException` is thrown inside `createSessionWithUniqueCode`, the current transaction is marked as **rollback-only** by Spring. That's fine — we catch the exception and restart with a fresh `buildSession()` + `save()` call. Because the class-level `@Transactional` wraps the whole `createSession()` method, Spring's transaction manager handles the retry within the same outer transaction boundary.

> If you ever need each retry to run in its **own** transaction, annotate the inner method with `@Transactional(propagation = Propagation.REQUIRES_NEW)`.

---

## Summary

| Concept | Problem | Solution |
|---------|---------|----------|
| TOCTOU race condition | Two threads generate the same session code | Retry on `DataIntegrityViolationException` + UNIQUE constraint |
| Lost updates | Concurrent writes overwrite each other | `@Version` optimistic locking |
| Connection exhaustion | Default pool of 10 can't handle concurrent traffic | Explicit HikariCP config with 20 max connections |
| Partial writes | Multi-step DB operations leave inconsistent state if one step fails | `@Transactional` (Spring-managed commit/rollback) |

### Key takeaways

1. **Database constraints are your safety net** — application-level checks are an optimization, not a guarantee
2. **Optimistic locking (`@Version`)** is the right default for low-contention data (most web apps)
3. **Connection pools need explicit tuning** in production — defaults are too conservative for multi-user apps
4. **`@Transactional`** ensures all-or-nothing database writes — never leave your data half-updated
