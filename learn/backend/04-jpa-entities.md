# 04 — JPA Entities and Spring Data

## What is ORM?

**ORM** (Object-Relational Mapping) bridges the gap between Java objects and database tables. Instead of writing SQL like:

```sql
SELECT * FROM sessions WHERE session_code = 'ABC123'
```

You write Java:

```java
Optional<Session> session = sessionRepository.findBySessionCode("ABC123");
```

The ORM (Hibernate) generates the SQL for you.

**JPA** (Jakarta Persistence API) is the Java standard interface for ORM. **Hibernate** is the implementation used by Spring Boot by default. **Spring Data JPA** adds a repository abstraction on top.

## Entities — Java classes mapped to tables

An **entity** is a class annotated with `@Entity`. Each instance represents one row in the database.

```java
@Entity
@Table(name = "sessions")
@Data           // Lombok: getters, setters, toString, equals, hashCode
@Builder        // Lombok: builder pattern: Session.builder().name("X").build()
@NoArgsConstructor  // Lombok: default constructor (required by JPA)
@AllArgsConstructor // Lombok: constructor with all fields
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // AUTO_INCREMENT / SERIAL
    private Long id;

    @Column(name = "session_code", unique = true, nullable = false, length = 6)
    private String sessionCode;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)   // store "FIBONACCI" not 0, 1, 2...
    @Column(nullable = false)
    private SizingMethod sizingMethod;

    @Column(name = "is_active")
    private boolean active;

    @Column(name = "votes_revealed")
    private boolean votesRevealed;

    @Embedded                      // stored in the same sessions table
    private SessionSettings settings;

    @CreatedDate                   // auto-set on insert
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate              // auto-set on insert and update
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

## Lombok annotations explained

```java
@Getter             // generates getters for all fields
@Setter             // generates setters for all fields
@NoArgsConstructor  // JPA needs a no-arg constructor to load entities from DB
@AllArgsConstructor // builder also needs all-args constructor
@RequiredArgsConstructor // constructor for final/non-null fields (used in services)
@Builder            // enables: Session.builder().name("Foo").active(true).build()
@Slf4j              // adds: private static final Logger log = ...
```

Without Lombok, a 10-field entity would need ~100 lines of getters/setters. With Lombok: just annotations.

## Why JPA entities don't use `@Data`

Lombok's `@Data` is a shortcut for `@Getter + @Setter + @ToString + @EqualsAndHashCode`. It's convenient for plain Java objects, but **dangerous on JPA entities**.

### Problem 1: `equals`/`hashCode` over lazy collections

`@Data` generates `equals()` and `hashCode()` that include **all fields** by default. For an entity with a lazy-loaded `@OneToMany` collection:

```java
@Data  // ← dangerous
public class Session {
    private Long id;
    @OneToMany(fetch = FetchType.LAZY)
    private List<Story> stories;   // lazy — not loaded yet
}

// Somewhere outside a transaction:
session1.equals(session2);  // ← triggers loading of ALL stories for BOTH sessions!
```

This causes `LazyInitializationException` (if the Hibernate session is closed) or silent N+1 queries (if it's still open).

### Problem 2: `toString()` triggers cascade loading

Logging an entity with `@Data`-generated `toString()` will traverse every relationship:

```java
log.debug("Session: {}", session);  // ← loads stories → loads votes for each story → ...
```

This can load thousands of rows for a harmless log statement.

### Problem 3: bidirectional relationships cause stack overflow

```java
// Session has @OneToMany List<Story> stories
// Story has @ManyToOne Session session

session.toString()
  → Story.toString()  (for each story)
    → Session.toString()  (the story's session)
      → Story.toString()  (for each story again)
        → StackOverflowError
```

### The fix: explicit annotations

Replace `@Data` on JPA entities with specific annotations, and use `@EqualsAndHashCode` only on the `id`:

```java
@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)  // only compare by id
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include   // only this field participates in equals/hashCode
    private Long id;

    // ... other fields ...
    // No @ToString that traverses collections
}
```

With `@EqualsAndHashCode(onlyExplicitlyIncluded = true)`: two sessions are equal if and only if they have the same `id`. Collections are never touched.

## Relationships

### `@OneToMany` / `@ManyToOne` — one session has many stories

```java
// Session.java
@OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Story> stories = new ArrayList<>();
```

```java
// Story.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "session_id", nullable = false)
private Session session;
```

- `mappedBy = "session"` — tells JPA the `session` field in `Story` owns the foreign key column.
- `cascade = CascadeType.ALL` — operations on `Session` cascade to `Story` (e.g., deleting a session deletes its stories).
- `orphanRemoval = true` — stories removed from `session.stories` list are also deleted from DB.
- `fetch = FetchType.LAZY` — **don't** load stories from DB unless they are explicitly accessed. This is crucial for performance.

### Lazy loading

```java
Session session = sessionRepository.findById(1L).get();
// At this point: stories list is NOT loaded (lazy)

session.getStories();  // NOW it loads from DB (a second query)
```

Always be aware of lazy loading — accidentally calling `getStories()` inside a loop causes the "N+1 query problem" (one query per iteration). Map to DTOs in the service before the transaction ends.

### `@ManyToOne` — vote belongs to a user and a story

```java
// Vote.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "story_id")
private Story story;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
private User user;
```

### `@Embedded` — embedding settings into the sessions table

```java
// SessionSettings.java
@Embeddable  // not its own table — columns live in the parent table
public class SessionSettings {
    @Column(name = "auto_reveal")
    private boolean autoReveal;

    @Column(name = "timer_enabled")
    private boolean timerEnabled;

    @Column(name = "timer_duration")
    private int timerDuration = 300;   // seconds

    @Column(name = "allow_change_vote")
    private boolean allowChangeVote;

    @Column(name = "allow_observers")
    private boolean allowObservers;

    @Column(name = "require_confidence")
    private boolean requireConfidence;
}

// Session.java
@Embedded
private SessionSettings settings;
// → adds auto_reveal, timer_enabled, etc. columns directly to sessions table
```

### Custom type converter — storing `List<String>` as JSON

JPA doesn't know how to store a `List<String>` in a single column. A `@Converter` handles this:

```java
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        return new ObjectMapper().writeValueAsString(list);  // → "[\"3\",\"5\",\"8\"]"
    }

    @Override
    public List<String> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        return new ObjectMapper().readValue(json, new TypeReference<List<String>>(){});
    }
}

// Usage in entity:
@Convert(converter = StringListConverter.class)
@Column(name = "custom_values")
private List<String> customValues;
```

## Spring Data JPA Repositories

Spring Data JPA provides repository interfaces with CRUD operations out of the box. You **don't write any implementation** — Spring generates it at runtime.

```java
// SessionRepository.java
@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // JpaRepository provides: save(), findById(), findAll(), delete(), count()...

    // Custom queries: Spring generates SQL from the method name
    Optional<Session> findBySessionCode(String sessionCode);
    List<Session> findByActiveTrue();
    boolean existsBySessionCode(String code);
    long countByActiveTrueAndCreatedAtAfter(LocalDateTime since);
}
```

### Derived query methods

Spring parses the method name to build the SQL:

| Method name | Generated SQL |
|-------------|---------------|
| `findBySessionCode(code)` | `WHERE session_code = ?` |
| `findByActiveTrue()` | `WHERE is_active = true` |
| `findBySessionAndActiveTrue(session)` | `WHERE session_id = ? AND is_active = true` |
| `countByActiveTrueAndCreatedAtAfter(date)` | `SELECT COUNT(*) WHERE is_active = true AND created_at > ?` |
| `deleteBySessionCode(code)` | `DELETE WHERE session_code = ?` |
| `existsBySessionCode(code)` | `SELECT COUNT(*) > 0 WHERE session_code = ?` |

The keywords: `findBy`, `countBy`, `deleteBy`, `existsBy`, `And`, `Or`, `True`, `False`, `After`, `Before`, `Between`, `OrderBy`, `Asc`, `Desc`.

### Custom JPQL queries

For complex queries, use `@Query` with JPQL (object-oriented SQL):

```java
@Query("SELECT v FROM Vote v WHERE v.story.id = :storyId AND v.user.id = :userId")
Optional<Vote> findByStoryAndUser(@Param("storyId") Long storyId, @Param("userId") Long userId);
```

Or native SQL (use sparingly):
```java
@Query(value = "SELECT * FROM votes WHERE story_id = ?1 ORDER BY voted_at DESC", nativeQuery = true)
List<Vote> findVotesByStoryNative(Long storyId);
```

## A complete entity relationship diagram

```
sessions (1) ────── (N) stories
  │                     │
  │                     └── (N) votes ──── (N) users
  │                                            │
  └──────── (1) moderator (FK → users) ────────┘
  └──────── (1) currentStory (FK → stories)

(sessions.moderator_id → users.id — deferred circular FK)
(sessions.current_story_id → stories.id — deferred circular FK)
```

## Circular foreign keys — the `@ManyToOne` cross-reference

`Session` references `User` (as moderator) and `Story` (as current story), but `User` and `Story` also back-reference `Session`. This creates a circular dependency.

In JPA:
```java
// Session.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "moderator_id")
private User moderator;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "current_story_id")
private Story currentStory;
```

In the database migration, these FK constraints are added with `ALTER TABLE` *after* both tables exist, using `DEFERRABLE INITIALLY DEFERRED` (PostgreSQL) to allow inserting a session before users exist.

## Key takeaways

- `@Entity` maps a Java class to a database table; each instance = one row.
- Lombok annotations (`@Data`, `@Builder`, `@NoArgsConstructor`) eliminate boilerplate.
- `@OneToMany` / `@ManyToOne` model relationships; `cascade` and `orphanRemoval` manage lifecycle.
- `LAZY` loading is the default for collections — don't accidentally trigger N+1 queries.
- `@Embedded` stores a value object's fields in the parent table (no separate table).
- Spring Data JPA generates SQL from method names — you rarely write queries manually.
- `@Transactional` in the service layer keeps entity loading and saving in one session.

---
**Next:** [05 — Spring Security and JWT](05-security-jwt.md)
