# Backend Interview Questions

Covers every technology used in the EstiMate backend.  
Difficulty: 🟢 Foundational · 🟡 Intermediate · 🔴 Advanced

---

## Spring Boot

### 🟢 What is Spring Boot and how does it differ from plain Spring Framework?

**Key points:**
- Spring Framework is a large, modular Java framework — you wire everything yourself (beans, data sources, security config, etc.).
- Spring Boot adds **auto-configuration**: it inspects the classpath and configures sensible defaults automatically (e.g., if `spring-boot-starter-data-jpa` is present and a `DataSource` bean is missing, it creates one).
- `@SpringBootApplication` combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`.
- Embedded server (Tomcat): `java -jar app.jar` starts the whole application — no separate app server needed.

---

### 🟢 What is dependency injection (DI) and why does Spring use it?

**Key points:**
- DI means a class does not create its own dependencies — they are *injected* by the container.
- Benefit: classes are loosely coupled and independently testable (inject a mock instead of the real dependency).
- Spring's IoC (Inversion of Control) container manages the lifecycle of all beans and wires them together.
- In EstiMate, `SessionController` does not `new SessionServiceImpl()` — Spring injects the service via constructor injection, enabling test doubles.

---

### 🟡 What is the difference between `@Component`, `@Service`, `@Repository`, and `@Controller`?

**Key points:**
- All four are stereotypes of `@Component` — they all register a Spring-managed bean.
- `@Repository` activates exception translation (JPA/JDBC exceptions → Spring's `DataAccessException`).
- `@Service` is a semantic marker for the service layer — no extra behaviour.
- `@Controller` / `@RestController` activate the MVC dispatcher to route HTTP requests.
- Use the appropriate stereotype; it communicates intent and enables layer-specific features.

---

### 🟡 How does `@Transactional` work? What is the default propagation behaviour?

**Key points:**
- `@Transactional` wraps the method in a database transaction. If the method throws an unchecked exception, the transaction rolls back.
- Spring uses a **proxy** around the bean — calling `@Transactional` methods from within the same class bypasses the proxy (self-invocation problem).
- Default propagation is `REQUIRED`: joins an existing transaction if one exists; creates a new one if not.
- Default rollback rule: rolls back on `RuntimeException` and `Error`; commits on checked exceptions.

---

### 🔴 Explain how Spring Boot auto-configuration works internally.

**Key points:**
- `@EnableAutoConfiguration` triggers loading of `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- Each auto-configuration class is annotated with `@ConditionalOnClass`, `@ConditionalOnMissingBean`, etc.
- Example: `DataSourceAutoConfiguration` creates a `DataSource` bean **only if** `javax.sql.DataSource` is on the classpath and no `DataSource` bean has been defined.
- You can exclude specific auto-configurations with `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`.

---

## REST Controllers

### 🟢 What does `@RestController` do differently from `@Controller`?

**Key points:**
- `@RestController` = `@Controller` + `@ResponseBody`.
- `@ResponseBody` tells Spring to serialize the return value directly to the HTTP response body (via Jackson) instead of interpreting it as a view name.

---

### 🟢 What is the difference between `@PathVariable` and `@RequestParam`?

**Key points:**
- `@PathVariable` binds a value from the URL path: `GET /sessions/{code}` → `@PathVariable String code`.
- `@RequestParam` binds a query parameter: `GET /sessions?page=2` → `@RequestParam int page`.
- `@RequestBody` binds the JSON body of a POST/PUT request to a Java object (deserialized by Jackson).

---

### 🟡 How does Jackson serialize/deserialize Java objects to/from JSON?

**Key points:**
- Jackson uses reflection (or annotations) to map Java fields to JSON keys.
- `@JsonProperty("session_code")` overrides the default field name.
- `@JsonIgnore` excludes a field from serialization.
- `@JsonInclude(NON_NULL)` skips null fields.
- Lombok's `@Data` / `@Getter` / `@Setter` generate the getters Jackson uses for serialization.
- Custom `ObjectMapper` configuration (in EstiMate's config) can set global settings like date formatting.

---

### 🟡 What is the Richardson Maturity Model and which level does EstiMate target?

**Key points:**
- **Level 0**: single endpoint, no HTTP semantics.
- **Level 1**: individual resources (`/sessions`, `/sessions/{code}/stories`).
- **Level 2**: HTTP verbs used correctly (GET reads, POST creates, PUT/PATCH updates, DELETE removes) + proper status codes.
- **Level 3**: Hypermedia (HATEOAS) — responses include links to related actions.
- EstiMate targets **Level 2** — proper resources, verbs, and status codes, without HATEOAS overhead.

---

## Service Layer and Design Patterns

### 🟡 Why program to interfaces (`ISessionService`) rather than concrete classes?

**Key points:**
- The controller depends on the `ISessionService` interface, not `SessionServiceImpl`.
- In tests, you can inject a mock that implements `ISessionService` — no real database required.
- Swapping the implementation (e.g., for a different storage strategy) requires no changes to the controller.
- This is the **Dependency Inversion Principle** (SOLID: D).

---

### 🟡 What is a DTO and why should you not return JPA entities from controllers?

**Key points:**
- DTO (Data Transfer Object) is a plain class that represents the API's request or response shape.
- JPA entities carry database concerns (lazy-loading proxies, bidirectional relationships, `@Version` fields) that leak if serialized directly.
- Returning an entity with a lazy `@OneToMany` can trigger N+1 queries during Jackson serialization.
- DTOs decouple the API contract from the database schema — you can change one without changing the other.
- In EstiMate, `SessionDTO`, `StoryDTO`, `VoteDTO` etc. are explicitly mapped from entities in the service layer.

---

## JPA and Hibernate

### 🟢 What is ORM? What problem does JPA/Hibernate solve?

**Key points:**
- ORM (Object-Relational Mapping) maps Java class ↔ database table without writing SQL for every operation.
- JPA is the specification; Hibernate is the most common implementation.
- You annotate a class with `@Entity` and its fields with `@Column`, `@Id`, etc., and Spring Data JPA generates the SQL.

---

### 🟡 What is the difference between `@OneToMany` with `EAGER` vs `LAZY` fetching?

**Key points:**
- `LAZY` (default for collections): related entities are loaded only when you access the field — a separate SQL query runs then.
- `EAGER`: related entities are loaded in the same query (JOIN) — always fetched, whether you need them or not.
- Prefer `LAZY` — `EAGER` on large collections causes performance problems.
- The **N+1 problem**: loading N sessions and then accessing `session.getStories()` for each one fires N extra queries. Fix with `JOIN FETCH` or `@EntityGraph`.

---

### 🟡 What does `@Version` do? How does optimistic locking work?

**Key points:**
- `@Version` adds a version column (`bigint`) to the table.
- When updating a row, Hibernate includes `WHERE version = X` in the SQL. If another transaction already incremented the version, 0 rows are updated → Hibernate throws `OptimisticLockException`.
- This prevents the **TOCTOU** (Time-Of-Check-Time-Of-Use) race condition: two users reading the same row and both writing based on stale data.
- EstiMate adds `@Version` on `Session` to prevent duplicate votes from concurrent requests.
- No database locks held — transactions proceed concurrently; only the last writer loses (must retry).

---

### 🟡 What is a Spring Data JPA repository? How does `findBySessionCode` work?

**Key points:**
- Extending `JpaRepository<Session, Long>` gives you save, find, delete, and pagination for free.
- Spring Data parses method names: `findBySessionCode(String code)` generates `SELECT * FROM session WHERE session_code = ?`.
- Complex queries use `@Query("SELECT s FROM Session s WHERE ...")` with JPQL or native SQL.
- `@Transactional(readOnly = true)` on read methods hints to Hibernate to skip dirty-checking — improves performance.

---

### 🔴 Explain the JPA first-level cache and when it can cause stale reads.

**Key points:**
- Hibernate's first-level cache is the **persistence context** (scoped to a `Session` / transaction).
- Within a transaction, loading the same entity twice returns the same Java object — no second SQL query.
- Stale read scenario: thread A reads entity, thread B updates it in a separate transaction, thread A reads again in the *same* transaction — still gets the old value.
- Fix: `entityManager.refresh(entity)` or start a new transaction.
- In Spring: each `@Transactional` method starts a fresh persistence context, so stale reads across requests are not a problem.

---

## Spring Security and JWT

### 🟢 What is the difference between authentication and authorization?

**Key points:**
- **Authentication**: proving identity — "who are you?" (JWT validation, username+password check).
- **Authorization**: what you're allowed to do — "can you do this?" (`hasRole('MODERATOR')`, session ownership checks).
- Spring Security processes authentication first, then authorization (filter chain order matters).

---

### 🟡 Explain the three parts of a JWT and what makes it tamper-evident.

**Key points:**
- `header.payload.signature` — all three parts are Base64URL-encoded, separated by dots.
- **Header**: algorithm (`HS256` = HMAC-SHA256, `RS256` = RSA).
- **Payload**: claims — `sub` (subject/userId), `exp` (expiry), `iat` (issued-at), plus custom claims like `sessionCode`.
- **Signature**: `HMAC-SHA256(base64(header) + "." + base64(payload), secretKey)`.
- If anyone modifies the payload, the recalculated signature won't match the stored signature → token rejected.
- The secret key is only known to the server — clients can read the payload but cannot forge a valid signature.

---

### 🟡 Why is `STATELESS` session policy combined with disabling CSRF in a JWT API?

**Key points:**
- `STATELESS` tells Spring Security to never create an `HttpSession` — the JWT *is* the session.
- CSRF (Cross-Site Request Forgery) attacks rely on the browser automatically sending a session cookie. With no cookie (JWT in `Authorization` header), CSRF is not a concern.
- `Authorization: Bearer <token>` headers are not automatically sent by the browser cross-origin — only cookies are.
- **Never** disable CSRF for a cookie-based session app.

---

### 🟡 What is `OncePerRequestFilter` and why use it for JWT validation?

**Key points:**
- `OncePerRequestFilter` guarantees the filter runs exactly once per request, even if the request is dispatched multiple times (e.g., after a forward).
- JWT validation is idempotent — it should not run twice for the same request.
- The filter extracts the `Authorization: Bearer <token>` header, validates the signature, and sets the authentication in `SecurityContextHolder`.

---

### 🔴 What is horizontal privilege escalation and how does EstiMate prevent it?

**Key points:**
- A user is authenticated (valid JWT) but tries to access *another user's* resource — e.g., user in session `ABC123` calls `GET /api/sessions/XYZ789/stories`.
- JWT authentication only proves *who* the user is; it doesn't check *which session* they belong to.
- `SessionAccessValidator` compares the `sessionCode` claim in the JWT against the `{code}` path variable. If they don't match, it throws `UnauthorizedAccessException` → 403 Forbidden.
- This is a business-logic authorization check, separate from Spring Security's `anyRequest().authenticated()`.

---

## Spring WebSocket (STOMP)

### 🟡 Why doesn't Spring's `JwtAuthenticationFilter` run for WebSocket connections?

**Key points:**
- Servlet filters run on HTTP requests. The WebSocket handshake is an HTTP request, but once upgraded, subsequent STOMP frames are not HTTP.
- `WebSocketAuthInterceptor` (a `ChannelInterceptor`) intercepts the STOMP `CONNECT` frame — the only place where the client sends the JWT over WebSocket.
- Checking every STOMP frame would be too expensive; checking on `CONNECT` is the right trade-off.

---

### 🟡 What is the simple in-memory broker vs. an external broker (RabbitMQ/ActiveMQ)?

**Key points:**
- `enableSimpleBroker("/topic")` keeps all subscriber lists in JVM memory — fast, zero dependencies, works for a single server instance.
- If you run multiple server instances behind a load balancer, client A connects to server 1 and client B connects to server 2. A message published on server 1's in-memory broker is never seen by client B.
- External broker relay (`enableStompBrokerRelay`) forwards all messages to a central broker (RabbitMQ), which fans them out to all connected servers. This enables horizontal scaling.
- EstiMate uses the simple broker — correct for single-instance deployments.

---

## Exception Handling

### 🟢 What is `@RestControllerAdvice` and how is it different from try-catch in every controller?

**Key points:**
- `@RestControllerAdvice` defines a class whose `@ExceptionHandler` methods apply to *all* controllers.
- Without it, each controller method needs its own try-catch with duplicated error-response logic.
- The handler can map `SessionNotFoundException` → `404`, `UnauthorizedAccessException` → `403`, etc., in one place.
- The return value is automatically serialized to JSON (because of `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`).

---

### 🟡 What is `ResponseEntity` and when would you return it instead of a plain object?

**Key points:**
- `ResponseEntity<T>` wraps a response body `T` and lets you control the HTTP status code and headers.
- Returning `void` from a controller method always sends `200 OK`; `ResponseEntity.noContent().build()` sends `204 No Content` — the correct code for a successful DELETE.
- `ResponseEntity.created(uri).body(dto)` sends `201 Created` with a `Location` header — the correct code for POST creating a resource.

---

## Database and Flyway

### 🟢 What is a database migration tool and why is one needed?

**Key points:**
- Production databases are shared mutable state. Changes to the schema (new column, new index) must be applied to the live database without data loss.
- Flyway tracks which SQL scripts (migrations) have been applied. On startup, it runs any new migrations in version order.
- Without a migration tool, developers manually run SQL on each environment — error-prone and untrackable.
- Hibernate's `spring.jpa.hibernate.ddl-auto=update` is tempting but dangerous in production (it can lose data on column renames).

---

### 🟡 What is the difference between H2 (dev) and PostgreSQL (production) in this project?

**Key points:**
- H2 is an in-memory database that starts fresh every time the application starts — ideal for development (no install required, tests are isolated).
- PostgreSQL is the production database: persistent, concurrent, full-featured.
- Flyway migrations must be SQL-standard enough to run on both. EstiMate uses `application-prod.properties` to activate the PostgreSQL data source.
- The `spring.profiles.active=prod` environment variable switches profiles at startup.

---

### 🟡 What are database indexes and when would you add one?

**Key points:**
- An index is a data structure (B-tree by default) that speeds up lookups on a column at the cost of slower writes and extra storage.
- Add an index when a column is frequently used in `WHERE`, `JOIN ON`, or `ORDER BY` clauses.
- In EstiMate, `session_code` (a VARCHAR used in almost every query) has a unique index.
- Don't add indexes speculatively — index maintenance slows INSERT/UPDATE/DELETE. Add based on query profiling.

---

## Testing (JUnit 5 + Mockito)

### 🟢 What is the Given / When / Then (Arrange / Act / Assert) pattern?

**Key points:**
- **Given**: set up the preconditions — input data, mock returns, database state.
- **When**: invoke the method under test.
- **Then**: assert the output matches expectations.
- Makes tests readable and forces each test to have a single, clear purpose.

---

### 🟡 What is Mockito and what does `@Mock` / `@InjectMocks` do?

**Key points:**
- Mockito creates fake implementations of interfaces/classes at runtime.
- `@Mock` creates a mock; `@InjectMocks` creates the real class and injects all `@Mock` fields into it.
- `when(mock.method()).thenReturn(value)` stubs a method call; `verify(mock).method()` asserts it was called.
- `@ExtendWith(MockitoExtension.class)` activates Mockito's JUnit 5 integration.

---

### 🟡 What is `@WebMvcTest` and how is it different from `@SpringBootTest`?

**Key points:**
- `@SpringBootTest` loads the full application context — slow, requires a database.
- `@WebMvcTest(SessionController.class)` loads only the MVC layer (controller, filters, security) — fast, no database.
- You inject mock services with `@MockBean`; Spring MVC handles the request routing and security.
- Use `MockMvc` to perform requests and assert on the response status, headers, and JSON body.

---

### 🟡 What does `@Transactional` on a test method do?

**Key points:**
- After the test method completes, the transaction is **rolled back** — any data written to the database is removed.
- This makes integration tests order-independent: each test starts with a clean state.
- Don't use it when testing the transactional behaviour itself — rolling back hides failures.

---

### 🔴 How do you test code that involves `@Version` optimistic locking?

**Key points:**
- You need two concurrent transactions that both read the same row, then both try to write.
- In a unit test, you can simulate the exception by stubbing the repository to throw `OptimisticLockException`.
- For a realistic test, use `@SpringBootTest` with H2 and two threads that both call `voteRepository.save()` after reading the same version.
- Assert that one transaction succeeds and the other receives the appropriate error response.

---

## Pagination

### 🟡 What is `Pageable` in Spring Data and how does it work end-to-end?

**Key points:**
- `Pageable` encapsulates `page` (0-indexed), `size` (items per page), and `sort` specification.
- Controller receives it from query parameters (`?page=0&size=20&sort=createdAt,desc`) using `@PageableDefault`.
- Repository method: `Page<Story> findBySessionId(Long id, Pageable pageable)` — Spring Data generates the `LIMIT`/`OFFSET` SQL.
- The `Page<T>` response wraps the content and adds metadata: `totalElements`, `totalPages`, `number`, `size`.
- The frontend uses `totalPages` to render pagination controls.

---

### 🟡 What are the trade-offs of OFFSET-based pagination vs cursor-based pagination?

**Key points:**
- **OFFSET**: simple, supports jumping to any page, but degrades on large tables (the DB must skip N rows) and is inconsistent if rows are inserted/deleted between pages.
- **Cursor**: uses a `WHERE id > lastSeenId` clause — O(log n) regardless of page number; consistent under inserts.
- Cursor pagination is best for infinite scroll / "load more" patterns.
- EstiMate uses OFFSET (Spring `Pageable`) — adequate for small story backlogs.

---

## Concurrency

### 🔴 What is a TOCTOU race condition? Give an example from EstiMate.

**Key points:**
- TOCTOU (Time-Of-Check-Time-Of-Use): a condition is checked, then time passes before acting on it, and the condition may have changed.
- EstiMate scenario: two users submit votes concurrently. Thread A reads `session.voteCount = 3`, Thread B reads `session.voteCount = 3`. Both increment and save `4` — one vote is lost.
- Fix 1: **Optimistic locking** (`@Version`) — one of the saves fails with `OptimisticLockException`; the caller retries.
- Fix 2: **Pessimistic locking** (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) — a database-level row lock; one thread waits while the other completes. Higher contention, guaranteed success.
- EstiMate uses optimistic locking — better performance under low contention (most requests succeed first time).

---

### 🔴 What is a connection pool and why does HikariCP matter in production?

**Key points:**
- Opening a database connection is expensive (~50–100 ms). A connection pool keeps a set of open connections ready to hand out.
- HikariCP is Spring Boot's default pool — known for low overhead and fast checkout.
- Key settings: `maximumPoolSize` (max concurrent connections), `connectionTimeout` (how long to wait for a connection before failing).
- Under-sizing the pool: requests queue up and time out under load.
- Over-sizing: exceeds PostgreSQL's `max_connections` limit; the database rejects connections.
- EstiMate's `application-prod.properties` tunes `maximum-pool-size=10` and `connection-timeout=30000`.

---

---
**Back to overview:** [Interview Questions README](README.md)  
**Related learning:** [Backend Learning Path](../backend/README.md)
