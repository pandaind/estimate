# 08 — Database, Flyway, and Environments

## Two databases, one codebase

EstiMate uses different databases in different environments:

| Environment | Database | Why |
|-------------|----------|-----|
| Development | **H2** (in-memory) | No install needed, starts fresh every run, H2 console for inspection |
| Production | **PostgreSQL** | Persistent, scalable, industry-standard |

Spring **profiles** and **Flyway** manage this difference.

## H2 — the development database

H2 is a Java database that runs inside the JVM process. No separate server needed.

```properties
# application.properties (dev defaults)
spring.datasource.url=jdbc:h2:mem:planningpoker;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=create-drop
# create-drop: creates tables on startup, drops on shutdown
# Great for dev — always starts with a clean DB

spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**H2 console**: While the app is running in dev mode, visit `http://localhost:8080/h2-console`:
- JDBC URL: `jdbc:h2:mem:planningpoker`
- Username: `sa`, Password: (empty)

You can browse all tables, run `SELECT` queries, and watch data appear as you test the app. This is a great way to understand what JPA is doing to the database.

## PostgreSQL — the production database

PostgreSQL is a real relational database. Its config lives in `application-prod.properties`.

## Spring Profiles — environment-specific configuration

A **profile** is a named set of configuration that overrides the defaults.

Activate the `prod` profile:
```bash
java -jar planning-poker.jar --spring.profiles.active=prod
# or via env var:
SPRING_PROFILES_ACTIVE=prod java -jar planning-poker.jar
```

```properties
# application-prod.properties (only loaded when profile=prod)
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:planningpoker}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=validate
# validate: checks that DB schema matches entities, but makes NO changes
# Flyway manages the schema in prod

spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

spring.h2.console.enabled=false  # never expose H2 console in production
```

The `${ENV_VAR}` syntax reads from environment variables — passwords are never hardcoded.

`ddl-auto=validate` is important: in production, Hibernate should NEVER automatically modify the schema. Flyway handles that.

## Flyway — database schema migrations

**The problem**: when you add a column to a JPA entity in production, the running database still has the old schema. How do you update it safely?

**Flyway** manages this with versioned migration scripts. Each script has a version number and runs exactly once, in order.

```
backend/src/main/resources/db/migration/
  V1__initial_schema.sql    ← creates all tables from scratch
  V2__add_priority_column.sql  ← (future: adds a column)
  V3__add_tags_to_stories.sql  ← (future: adds another column)
```

### Flyway tracks what's been applied

Flyway creates a `flyway_schema_history` table in your database:

```sql
version |   description    |       installed_on        | success
--------|-----------------|---------------------------|--------
1       | initial schema   | 2026-01-15 10:00:00.000   | true
2       | add priority col | 2026-02-01 09:30:00.000   | true
```

On startup, Flyway compares this table to the migration files. New files run; applied files are skipped. If a file's checksum changes after it was applied, Flyway errors out to prevent inconsistency.

## `V1__initial_schema.sql` — the foundation

```sql
-- Create sessions table first (no FKs to other tables yet)
CREATE TABLE sessions (
    id              BIGSERIAL PRIMARY KEY,
    session_code    VARCHAR(6) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    sizing_method   VARCHAR(50) NOT NULL,
    custom_values   TEXT,
    moderator_id    BIGINT,              -- FK added later (circular)
    current_story_id BIGINT,            -- FK added later (circular)
    is_active       BOOLEAN DEFAULT true,
    votes_revealed  BOOLEAN DEFAULT false,

    -- embedded SessionSettings
    auto_reveal         BOOLEAN DEFAULT false,
    timer_enabled       BOOLEAN DEFAULT false,
    timer_duration      INTEGER DEFAULT 300,
    allow_change_vote   BOOLEAN DEFAULT true,
    allow_observers     BOOLEAN DEFAULT true,
    require_confidence  BOOLEAN DEFAULT false,
    moderator_can_vote  BOOLEAN DEFAULT true,

    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Create users table  
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    avatar          VARCHAR(255),
    session_id      BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    is_active       BOOLEAN DEFAULT true,
    is_observer     BOOLEAN DEFAULT false,
    is_moderator    BOOLEAN DEFAULT false,
    joined_at       TIMESTAMP DEFAULT NOW(),
    last_seen_at    TIMESTAMP DEFAULT NOW()
);

-- Create stories table
CREATE TABLE stories (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    acceptance_criteria TEXT,
    tags                TEXT,
    priority            VARCHAR(50) DEFAULT 'MEDIUM',
    session_id          BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    order_index         INTEGER DEFAULT 0,
    status              VARCHAR(50) DEFAULT 'NOT_ESTIMATED',
    final_estimate      VARCHAR(50),
    estimate_notes      TEXT
);

-- Create votes table
CREATE TABLE votes (
    id          BIGSERIAL PRIMARY KEY,
    story_id    BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estimate    VARCHAR(50) NOT NULL,
    confidence  INTEGER,
    voted_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (story_id, user_id)          -- one vote per user per story
);

-- Now add the circular FK constraints (deferred)
ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_moderator
    FOREIGN KEY (moderator_id) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_current_story
    FOREIGN KEY (current_story_id) REFERENCES stories(id) DEFERRABLE INITIALLY DEFERRED;

-- Indexes for common queries
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_stories_session ON stories(session_id);
CREATE INDEX idx_votes_story ON votes(story_id);
CREATE INDEX idx_users_session ON users(session_id);
```

### Deferred foreign keys explained

`sessions.moderator_id` → `users.id` creates a **circular dependency**:
- To insert a session, you need a moderator user id.
- To insert a user, you need a session id.

Neither can come first with strict FK enforcement.

**Solution**: `DEFERRABLE INITIALLY DEFERRED` means the FK constraint is checked at the **end of the transaction**, not immediately after each INSERT. So:
1. INSERT session without moderator_id
2. INSERT user with session_id
3. UPDATE session, set moderator_id
4. Commit transaction → FK constraint checked now → both exist → ✓

## Schema design decisions and why

### `BIGSERIAL` for primary keys

```sql
id BIGSERIAL PRIMARY KEY
-- =  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
-- auto-incrementing 64-bit integer
```

A `session_code` (`VARCHAR(6)`) is the **public identifier** — what users share. The `id` is the **internal identifier** for JPA relationships. Separating them is good practice: the internal structure is hidden from the API.

### `ON DELETE CASCADE`

```sql
session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
```

When a session is deleted, all its users, stories, and votes are automatically deleted. Without this, the database would reject the delete (foreign key violation). The cascade implements the business rule: "deleting a session removes everything in it."

### `UNIQUE (story_id, user_id)` on votes

```sql
UNIQUE (story_id, user_id)
```

Enforces at the database level that a user can only cast one vote per story. Even if two concurrent requests try to cast votes simultaneously, only one will succeed — the other gets a `UNIQUE constraint violation`. The application layer guards this too, but the DB constraint is the last line of defence.

### Indexes

```sql
CREATE INDEX idx_sessions_code ON sessions(session_code);
```

Without this index, `WHERE session_code = 'ABC123'` would scan every row in the sessions table. With the index, it's a direct lookup — O(log n) instead of O(n). Add indexes on columns used in `WHERE`, `JOIN ON`, and `ORDER BY` clauses.

## Writing a new migration

When you need to add or change the schema:

1. Create a new file: `V2__your_description.sql` (version must be higher than all existing)
2. Write the SQL: `ALTER TABLE stories ADD COLUMN story_points INTEGER;`
3. **Never modify existing migration files** — Flyway checks checksums; changing applied migrations will cause startup failure
4. Test locally (Flyway dev: set `spring.flyway.enabled=true` temporarily with `ddl-auto=none`)
5. Commit — on next production deploy, Flyway runs the new script

## Application properties — full reference

```properties
# === Development (application.properties) ===

# Which profile is this? (default = no profile / dev)
spring.profiles.active=dev

# H2 datasource
spring.datasource.url=jdbc:h2:mem:planningpoker;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver

# Hibernate creates/drops schema automatically (dev only)
spring.jpa.hibernate.ddl-auto=create-drop

# Log all SQL (very useful for learning)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# H2 browser console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Flyway off in dev
spring.flyway.enabled=false

# JWT (never commit real secrets)
jwt.secret=${JWT_SECRET:your-dev-secret-key-at-least-32-chars}
jwt.expiration=7200000

# CORS
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173}

# Logging
logging.level.com.pandac=DEBUG
logging.level.org.springframework.security=DEBUG
```

```properties
# === Production (application-prod.properties) ===
spring.datasource.url=jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.flyway.enabled=true
spring.h2.console.enabled=false
logging.level.com.pandac=INFO
```

## Key takeaways

- H2 (in-memory) for development: no setup, fresh state on every restart, browser console.
- PostgreSQL for production: persistent, reliable, production-grade.
- Spring profiles (`application-prod.properties`) apply when `spring.profiles.active=prod`.
- `ddl-auto=create-drop` is for dev only — Hibernate manages the schema.
- `ddl-auto=validate` for production — Flyway manages the schema, Hibernate just checks it.
- Flyway migration files are versioned, applied once, and never modified after applied.
- `DEFERRABLE INITIALLY DEFERRED` solves circular FK references within a transaction.
- `ON DELETE CASCADE` automates cleanup; `UNIQUE` constraints enforce business rules at the DB level.
- Indexes on frequently-queried columns are essential for performance.

---

**You've completed the backend learning path!**

With both frontend and backend covered, you now understand how the full stack fits together:

```
Browser (React)
  → Axios (HTTP) → Spring Boot Controllers → Services → JPA → PostgreSQL
  ↕ WebSocket (STOMP)
  → SimpMessagingTemplate → WebSocketEventPublisher → STOMP broker → Browser
```

Go back to the code and read it again — it should now make complete sense.
