# System Design Interview Questions

Architecture and design questions based on the EstiMate project.  
Difficulty: 🟢 Foundational · 🟡 Intermediate · 🔴 Advanced

---

## Architecture

### 🟢 Describe the high-level architecture of EstiMate.

**Key points:**
- **Frontend**: React single-page application (SPA) served as static files.
- **Backend**: Spring Boot REST API + WebSocket server.
- **Database**: PostgreSQL (production), H2 (development).
- **Communication**: REST for commands/reads; WebSocket (STOMP over SockJS) for real-time push events.
- **Auth**: Stateless JWT — no server-side session.
- **Infrastructure**: Docker containers orchestrated with Docker Compose.

```
Browser
  ├── REST (Axios)          →  Spring Boot  →  PostgreSQL
  └── WebSocket (STOMP)     →  Spring Boot  (in-memory STOMP broker)
```

---

### 🟡 Why was a single-page application (SPA) chosen instead of server-side rendering (SSR)?

**Key points:**
- Collaborative real-time UIs benefit from keeping the full application state in memory — the React + WebSocket combination allows instant local updates without round-trips.
- SSR is better for content-heavy, SEO-critical sites. A planning tool is used after authentication — SEO is irrelevant.
- SPA + REST API cleanly separates concerns: the backend is a pure API, usable by any future client (mobile, CLI, etc.).

---

### 🟡 Why does EstiMate use REST for writes and WebSocket only for broadcasts?

**Key points:**
- HTTP provides request-response semantics: the client knows immediately whether the write succeeded (200) or failed (400/403/409).
- WebSocket is fire-and-forget at the application level — no built-in acknowledgement or error response mechanism.
- All business-rule validation (is the user in this session? is the story active? has this user already voted?) lives in the Spring Security filter chain and service layer — which only runs on HTTP requests.
- Pattern: **REST as command channel, WebSocket as notification channel**. The frontend sends a REST request, receives a success/failure response, and the backend broadcasts the state change to all participants via WebSocket.

---

### 🔴 How would you scale EstiMate to support 10,000 concurrent sessions?

**Key points:**

**Horizontal scaling challenges:**
- The in-memory STOMP broker cannot span multiple JVM instances — a client on server A would not receive events published on server B.
- JWT authentication is stateless — no session affinity required for REST.

**Solutions:**

1. **External message broker** (RabbitMQ / Redis Pub/Sub):
   - Replace `enableSimpleBroker` with `enableStompBrokerRelay` pointing to a RabbitMQ cluster.
   - All backend instances connect to the same broker — events published on any instance fan out to all subscribers.

2. **Sticky sessions (simpler, less scalable)**:
   - Route all WebSocket connections from a session to the same backend instance using a session-code-aware load balancer.
   - Simpler to implement but creates uneven load and doesn't survive instance restarts.

3. **Database**:
   - Read replicas for analytics queries.
   - Connection pool sizing per instance × number of instances must stay below PostgreSQL's `max_connections`.
   - Consider **PgBouncer** (connection pooler) in front of PostgreSQL.

4. **Caching**:
   - Cache session lookups with Redis (session code → session ID) to avoid DB hits on every WebSocket message validation.

---

## Real-Time Collaboration

### 🟡 How does EstiMate ensure all participants see the same state?

**Key points:**
- The backend is the **single source of truth** — the database holds the authoritative state.
- All writes go through REST → database → WebSocket broadcast.
- On reconnection, the frontend does a full REST fetch to reconcile any missed events.
- This is the **event sourcing lite** pattern: events notify clients to re-sync, rather than encoding full state.
- There is no operational transform (OT) or CRDT because EstiMate does not have collaborative editing — it has sequential commands (activate story, cast vote, reveal).

---

### 🟡 What happens when a participant loses their WebSocket connection mid-session?

**Key points:**
- The frontend detects disconnection via missed heartbeats or the STOMP `disconnect` callback.
- It attempts reconnection with exponential backoff (`WebSocketProvider`).
- On successful reconnect, it calls `refreshSession()` (REST) to get the full current state.
- Any events missed during the outage are recovered from the REST response.
- This design (polling REST on reconnect) is simpler and more robust than event replay.

---

### 🔴 How would you add presence detection — showing which participants are currently online?

**Key points:**
- Track WebSocket connections in a server-side map: `sessionCode → Set<userId>`.
- On STOMP `CONNECT` (authenticated), add the user to the set and publish a `USER_ONLINE` event.
- On STOMP `DISCONNECT` or heartbeat timeout, remove the user and publish `USER_OFFLINE`.
- Scaling concern: with multiple backend instances, the in-memory map only reflects local connections — need Redis or the external broker to maintain global presence.
- Alternative: periodic REST poll from the frontend every 30 seconds (`GET /api/sessions/{code}/users/online`) — simpler but less real-time.

---

## Authentication Design

### 🟡 Why did EstiMate choose JWT over server-side sessions?

**Key points:**
- Planning sessions are short-lived and anonymous (no registration required). Maintaining server-side sessions would require session storage (Redis/DB) that the JWT approach avoids.
- JWT is **stateless**: any backend instance can validate a token without consulting a central store.
- Simpler horizontal scaling: no sticky sessions, no shared session store.
- Trade-off: JWTs cannot be invalidated before expiry (no revocation). Mitigated with short expiry (2 hours) and the fact that EstiMate sessions are temporary.

---

### 🔴 What are the security risks of storing a JWT in localStorage and how would you mitigate them?

**Key points:**
- **XSS (Cross-Site Scripting)**: malicious JavaScript on the page can read `localStorage` and steal the token.
  - Mitigation: strict Content Security Policy (CSP), input sanitization, React's automatic JSX escaping.
- **Alternative**: `HttpOnly` cookie storage — inaccessible to JavaScript, but then CSRF protection is required.
- For EstiMate (short-lived anonymous tokens, no sensitive personal data), `localStorage` with short expiry is an acceptable trade-off.
- For apps with sensitive data (banking, healthcare), prefer `HttpOnly` cookies + CSRF tokens or token rotation.

---

### 🟡 How does the WebSocket authentication differ from REST authentication in EstiMate?

**Key points:**
- REST: `JwtAuthenticationFilter` (a servlet filter) runs on every HTTP request, extracts the `Authorization: Bearer` header, and populates `SecurityContextHolder`.
- WebSocket: once the HTTP upgrade is complete, servlet filters no longer run.
- Solution: `WebSocketAuthInterceptor` (a STOMP `ChannelInterceptor`) validates the JWT in the STOMP `CONNECT` frame — once, at connection establishment.
- Subsequent STOMP frames are not re-validated (cost/benefit: the connection is already authenticated).

---

## Database Design

### 🟡 Explain the entity relationships in EstiMate.

**Key points:**
```
Session  1──* User      (one session has many participants)
Session  1──* Story     (one session has many stories)
Story    1──* Vote      (one story has many votes)
Vote     *──1 User      (each vote belongs to one user)
```
- `Session` has a current active story reference (nullable FK to `Story`).
- `User` has a `role` (MODERATOR / PARTICIPANT) scoped to the session.
- `SessionSettings` is an embeddable value object (sizing method, timer duration) stored in the `session` table.
- `Story` has `status` (PENDING / IN_PROGRESS / COMPLETED) and a `finalEstimate` set after reveal.

---

### 🟡 Why use Flyway for schema management instead of `ddl-auto=create-drop`?

**Key points:**
- `ddl-auto=create-drop` destroys and recreates the schema on every restart — catastrophic in production.
- `ddl-auto=update` attempts to apply changes but cannot handle column renames or drops safely.
- Flyway runs numbered SQL scripts in order. Scripts are immutable once applied — the history is auditable.
- Schema changes are code-reviewed, version-controlled, and applied the same way in every environment.
- Flyway's checksum verification prevents silent modification of already-applied scripts.

---

### 🔴 Design the database schema for a vote analytics feature that shows per-story consensus history.

**Sample answer:**
- `story_analytics` table: `story_id`, `min_vote`, `max_vote`, `average_vote`, `consensus` (bool), `vote_count`, `revealed_at`.
- Populated when votes are revealed via a service call in `revealVotes()`.
- Indexed on `session_id` (via story join) for analytics queries.
- Alternative: compute on the fly from the `vote` table — simpler, but slower for sessions with many stories.
- EstiMate's `AnalyticsService` takes the compute-on-the-fly approach; pre-computed would be an optimisation if needed.

---

## Docker and Infrastructure

### 🟢 What problem does Docker solve for this project?

**Key points:**
- "Works on my machine" problem: Docker packages the application and all its dependencies (Java runtime, OS libraries) into an image that runs identically everywhere.
- No manual Java/Node installation on the production server.
- `docker compose up` starts the full stack (backend, frontend, PostgreSQL) with one command.
- Environment configuration (DB passwords, JWT secret) is injected via environment variables — not baked into the image.

---

### 🟡 What is the difference between `docker-compose.yml`, `docker-compose.dev.yml`, and `docker-compose.production.yml`?

**Key points:**
- `docker-compose.yml`: the base configuration (service definitions, network, volumes).
- `docker-compose.dev.yml`: development overrides — e.g., bind-mounting source code for live reload, using H2 in-memory DB, exposing debug ports.
- `docker-compose.production.yml`: production overrides — PostgreSQL with persistent volume, production Spring profile, no dev tools.
- Run with: `docker compose -f docker-compose.yml -f docker-compose.production.yml up`.
- This pattern avoids duplicating the full configuration in each file.

---

### 🟡 What is a multi-stage Docker build and why does it produce a smaller image?

**Key points:**
- Stage 1 (build): full JDK + Maven → compile and package the JAR. This stage is large.
- Stage 2 (runtime): only JRE (no compiler, no Maven) → copy the JAR from stage 1 and run it.
- The final image contains only what's needed at runtime — typically 200–400 MB instead of 600+ MB.
- Build tools, source code, and intermediate class files are discarded.
- Same pattern applies to the frontend: Node.js + npm to build, then only the static files go into an Nginx image.

---

### 🔴 What monitoring and observability would you add to EstiMate for production?

**Key points:**

**Metrics** (Spring Boot Actuator + Prometheus + Grafana):
- JVM metrics: heap usage, GC pause time.
- HTTP metrics: request rate, error rate, latency percentiles (p50, p95, p99).
- HikariCP: active connections, pending threads.
- Custom metric: active WebSocket sessions.

**Logging** (structured JSON logs → ELK / Loki):
- Correlation ID on every request (MDC in Spring).
- Log slow queries (`spring.jpa.properties.hibernate.generate_statistics=true`).

**Tracing** (OpenTelemetry → Jaeger/Tempo):
- Trace a vote from REST request → DB → WebSocket publish to identify latency bottlenecks.

**Alerting**:
- Error rate > 1% → PagerDuty.
- Connection pool exhaustion → immediate alert.
- P99 latency > 2s → warning.

---

## API Design

### 🟡 How would you version the EstiMate REST API?

**Key points:**
- URL versioning: `/api/v1/sessions` — simple, cacheable, but pollutes URLs.
- Header versioning: `Accept: application/vnd.estimate.v2+json` — cleaner URLs but harder to test in a browser.
- Query parameter: `/api/sessions?version=2` — easy to test, but not RESTful.
- EstiMate currently has no versioning (single version). When introducing a breaking change, URL versioning is the most pragmatic starting point.
- **Non-breaking changes** (adding a new optional field) can be deployed without versioning.

---

### 🟡 What HTTP status codes should the API return for these scenarios?

| Scenario | Code |
|----------|------|
| Story successfully created | `201 Created` |
| GET a session that doesn't exist | `404 Not Found` |
| User submits a vote but already voted | `409 Conflict` |
| Missing / invalid JWT | `401 Unauthorized` |
| Valid JWT but wrong session | `403 Forbidden` |
| Vote submitted with invalid value | `400 Bad Request` |
| Server crash / unhandled exception | `500 Internal Server Error` |

**Key points:**
- `401` vs `403`: 401 means "you haven't identified yourself"; 403 means "I know who you are, but you can't do this".
- Always return a machine-readable error body (`{ "error": "...", "message": "..." }`) alongside the status code.

---

### 🔴 How would you design a rate-limiting strategy for the EstiMate API?

**Key points:**
- **Why**: prevent abuse — spamming votes, brute-forcing session codes.
- **Per-session rate limit**: at most N votes per user per story (enforced at business logic level — not really rate limiting).
- **Per-IP rate limit**: limit unauthenticated requests (join session) to prevent automated session scanning.
- **Implementation options**:
  1. Spring filter with a sliding-window counter in Redis.
  2. API gateway (AWS API Gateway, Kong) with built-in rate limiting.
  3. `bucket4j` library for in-process token bucket algorithm.
- **Response**: `429 Too Many Requests` with `Retry-After` header.

---

---
**Back to overview:** [Interview Questions README](README.md)  
**Related learning:** [Frontend Learning Path](../frontend/README.md) · [Backend Learning Path](../backend/README.md)
