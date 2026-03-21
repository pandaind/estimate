# EstiMate — Code Review Report

**Date:** 21 February 2026  
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6)  
**Scope:** Full monorepo — `backend/`, `frontend/`, `e2e-tests/`, `api-testing/`  
**Overall Rating: 7.0 / 10**

---

## 1. Executive Summary

EstiMate is a well-conceived, feature-rich real-time planning poker application. The architecture is
clean, the domain model is coherent, and the developer-experience foundations (Swagger, H2 console,
`start.sh`) are thoughtful. The primary concerns are a thin automated test suite on the backend,
several security hardening gaps, a handful of JPA/Lombok pitfalls, and the absence of
containerization or a backend CI pipeline.

---

## 2. Architecture
**Rating: 8 / 10**

| Strength | Detail |
|---|---|
| Layered design | `Controller → IService → ServiceImpl → Repository` with clean separation |
| Interface-first services | `ISessionService`, `IVoteService`, etc. enable easy mocking and future swapping |
| DTO layer | `CreateSessionRequest/Response`, `VoteRequest`, etc. decouple the API contract from domain entities |
| Centralized event bus | `WebSocketEventPublisher` keeps all broadcast logic in one place |
| Global exception handling | `GlobalExceptionHandler` maps every custom exception to an appropriate HTTP status with a consistent `ErrorResponse` shape |
| Frontend context + reducer | `SessionContext` with `useReducer` and localStorage persistence is idiomatic React |

**Issues:**

- **Service classes are growing large.** `SessionServiceImpl` is 269 lines; `AnalyticsService` is
  310 lines. Consider extracting sub-responsibilities (e.g. `SessionParticipantService`,
  `SessionVotingService`).
- **No repository-level pagination.** All queries returning collections (users, stories, votes) use
  `findAll`-style methods with no `Pageable`. This is a future N+1 and memory risk as sessions grow.
- **`PlanningPokerService.java`** exists alongside the `*ServiceImpl` pattern — its role is unclear
  without reading both files. Consolidate or document its distinct purpose.

---

## 3. Security
**Rating: 5.5 / 10** ⚠️

This is the most critical area requiring attention before any production deployment.

### 3.1 Hardcoded JWT Secret Fallback

`backend/src/main/resources/application.properties` line 34:
```properties
jwt.secret=${JWT_SECRET:5y7B!p@9$mK2%nX4#qR6&wE8*vC1^zT3+aL0-jH5=uF7~gD9<iS2>bN4|mP6}
```
The default value is committed to the repository. Any deployment that forgets to set `JWT_SECRET`
silently uses a publicly known key. **Remove the default value entirely** so the application fails
fast on startup if the environment variable is absent.

### 3.2 JWT Stored in localStorage

`frontend/src/utils/api.js` stores tokens in `localStorage`. This makes them accessible to any
JavaScript on the page (XSS attack vector). Prefer `HttpOnly`, `Secure`, `SameSite=Strict` cookies
managed server-side, or at minimum document the risk prominently.

### 3.3 H2 Console & Swagger Exposed Regardless of Profile

`SecurityConfig.java` grants `/h2-console/**` and `/swagger-ui/**` as public endpoints regardless
of the active Spring profile. Gate them behind a `@ConditionalOnProperty` or `@Profile("!prod")`
bean:
```java
@ConditionalOnProperty(name = "spring.h2.console.enabled", havingValue = "true")
```

### 3.4 WebSocket CORS Wildcard

`WebSocketConfig.java`:
```java
.setAllowedOriginPatterns("*")
```
The STOMP endpoint accepts connections from any origin. Reuse the `cors.allowed-origins` property
that is already applied correctly to HTTP endpoints.

### 3.5 No Rate Limiting

Acknowledged in `FUTURE_FEATURES.md`. Without it, `POST /api/sessions` and
`POST /api/sessions/*/join` are trivially abused. Add Bucket4j or Resilience4j rate-limiting
before any public launch.

### 3.6 Dev Database Password Committed

`spring.datasource.password=password` in `application.properties` is not a real risk for an
in-memory dev database, but the habit of committing credential values is worth flagging.

---

## 4. Code Quality
**Rating: 6.5 / 10**

### 4.1 `@Data` on JPA Entities (High Risk)

`Session.java`, `User.java`, and sibling entities all use Lombok `@Data`. This generates `equals()`,
`hashCode()`, and `toString()` over **all fields**, including `@OneToMany` lazy-loaded collections
on `Session`. Consequences:

- `toString()` triggers `LazyInitializationException` outside a transaction.
- Bidirectional relationships risk infinite recursion / stack overflow.
- JPA entity identity semantics are violated (Hibernate requires `equals`/`hashCode` based solely on
  the surrogate key).

**Fix:** Replace `@Data` with `@Getter @Setter @NoArgsConstructor @AllArgsConstructor` and add a
manual `equals`/`hashCode` based only on `id`, or use:
```java
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
// ...
@EqualsAndHashCode.Include
private Long id;
```

### 4.2 Boolean Wrapper Fields on Entities

`Boolean isActive`, `Boolean votesRevealed`, `Boolean isModerator` use wrapper types. If JPA ever
populates them as `null` (e.g. from a legacy or migrated row), unboxing will throw
`NullPointerException`. Use primitive `boolean` or enforce `@Column(nullable = false)` with a
`columnDefinition` DEFAULT on every such column (currently applied inconsistently).

### 4.3 Double Error Toast

`api.js` response interceptor calls `toast.error(errorMessage)`, and virtually every component
`catch` block then calls `toast.error(parseError(error).message)` again. Users see two identical
toasts per error.

**Fix:** Remove the `toast.error` call from the Axios interceptor (keep only the 401 token-clear
logic) and let each component handle its own user-facing message.

### 4.4 Suppressed ESLint Exhaustive-Deps Warnings

`PlanningPokerSession.jsx` and `useSessionWebSocket.js` both carry
`// eslint-disable-line react-hooks/exhaustive-deps`. In `useSessionWebSocket` the callback props
(`onStoryChange`, `onReveal`, etc.) are excluded from the dependency array — if callers pass inline
lambdas, subscriptions silently become stale after re-renders.

**Fix:** Wrap the callback props in `useCallback` at each call site and add them as stable
references to the dep array, then remove the suppression comment.

### 4.5 No Input Validation on Custom Sizing Values

`CUSTOM` sizing method values are split from a comma-separated string in `CreateSession.jsx` with
no backend validation enforcing non-empty values, maximum length, or acceptable characters.

---

## 5. Testing
**Rating: 4 / 10** ⚠️

This is the weakest area of the project.

| Layer | Coverage |
|---|---|
| Backend unit tests | 1 file: `JwtTokenServiceTest.java` only |
| Backend integration tests | None |
| Frontend unit / component tests | None |
| E2E tests (Playwright) | Good — covers main user journeys |
| API tests (Postman/Newman) | Exists in `api-testing/` |

### 5.1 Missing Backend Unit and Integration Tests

The entire service layer (`SessionServiceImpl`, `VoteServiceImpl`, `AnalyticsService`,
`StoryServiceImpl`) and all controllers have zero automated test coverage. At minimum add:

- **Service layer:** `@ExtendWith(MockitoExtension.class)` unit tests for key business rules —
  vote validation, session-code uniqueness, observer restrictions, moderator-can-vote flag.
- **Controller layer:** `@WebMvcTest` + MockMvc tests for each endpoint covering input validation,
  HTTP status codes, and authorization (role-based access).

### 5.2 `testValidateExpiredToken` Is a No-Op

`JwtTokenServiceTest.java` has a test named `testValidateExpiredToken` that generates a fresh token
and asserts it is immediately valid — expiration behaviour is never actually tested. This gives
false coverage confidence.

**Fix:** Override `jwt.expiration=1` in the test properties and add a `Thread.sleep(5)` before the
assertion, or mock `System.currentTimeMillis()`.

### 5.3 E2E Tests Are Well-Structured

`session.spec.js`, `voting.spec.js`, and `analytics.spec.js` are readable and cover the full user
journey from session creation through vote reveal. Minor concern: selectors like
`h1:has-text("Sprint Planning - Test Session")` are brittle under copy changes. Prefer
`data-testid` attributes.

### 5.4 No Frontend Unit Tests

There is no Vitest or Jest configuration in `frontend/package.json`. Prime candidates:

- `sessionReducer` in `SessionContext.jsx`
- `parseError` and `tokenManager` in `utils/`
- `EstimationCards`, `VotingResults`, and `StoryList` components

---

## 6. Database & Persistence
**Rating: 7 / 10**

| Area | Assessment |
|---|---|
| Flyway for production migrations | ✅ Properly used; `ddl-auto=validate` in prod profile |
| H2 dev/test isolation | ✅ Clean separation via Spring profiles |
| Production profile env vars | ✅ `${DATABASE_URL}` etc. with no committed defaults |
| Soft-delete for sessions | ✅ `isActive=false` — clean |
| Cascaded cleanup on session delete | ⚠️ `deleteSession` soft-deletes the session but leaves orphaned users, votes, and stories active |
| Timezone handling | ⚠️ `LocalDateTime` stores no timezone; can cause drift with server TZ changes or multi-region deployment — prefer `OffsetDateTime` |
| Index coverage | ⚠️ No explicit index definitions beyond `@Column(unique=true)` on `sessionCode`; FK columns (e.g. `session_id` on users/stories/votes) should be indexed |

---

## 7. DevOps / Infrastructure
**Rating: 5.5 / 10**

| Area | Status |
|---|---|
| CI pipeline for backend | ❌ None — no build/test gate on PRs |
| CI pipeline for E2E | ✅ `.github/workflows/e2e-tests.yml` exists |
| Docker / containerization | ❌ No `Dockerfile` for either service |
| `start.sh` reliability | ⚠️ Uses `sleep 10` to wait for backend — fragile; should use a health-check loop |
| Spring Boot version | `3.2.0` — upstream is `3.3.x`; not critical but consider upgrading for security patches |
| `application-test.properties` | ✅ Exists — good practice |

The absence of a backend CI pipeline is a notable gap: a broken `pom.xml` or misconfigured
`application.properties` is only caught when someone runs `mvn spring-boot:run` locally.

**Recommended addition:**
```yaml
# .github/workflows/backend-ci.yml
- run: mvn verify --no-transfer-progress
  working-directory: backend
```

---

## 8. Frontend Quality
**Rating: 7.5 / 10**

| Area | Assessment |
|---|---|
| Component decomposition | ✅ Good — session/story/voting/analytics split into focused subcomponents |
| Custom hooks | ✅ `useSessionWebSocket`, `useTheme` encapsulate concerns well |
| Error handling utility | ✅ `parseError` + `ErrorTypes` enum is a clean, reusable pattern |
| Loading state coverage | ⚠️ No skeleton screens or reconnect indicators during WebSocket downtime |
| TypeScript | ❌ Plain JS/JSX with no static type safety; `apiTypes.js` is documentation only |
| Accessibility | ⚠️ `aria-label` used in `CreateSession` but not consistently across all interactive controls |
| Mobile responsiveness | ⚠️ Explicitly documented as desktop-only in `FUTURE_FEATURES.md` |
| React / Vite versions | ✅ React 19 + Vite 7 — current |
| Animation library | ✅ Framer Motion used tastefully and non-intrusively |

---

## 9. Issue Priority Matrix

| # | Severity | Area | Issue |
|---|---|---|---|
| 1 | 🔴 Critical | Security | Remove hardcoded JWT secret default value from `application.properties` |
| 2 | 🔴 Critical | Code Quality | Replace `@Data` with safe Lombok annotations on all JPA entities |
| 3 | 🟠 High | Security | Gate H2 console and Swagger UI to non-production profiles only |
| 4 | 🟠 High | Testing | Add service-layer and `@WebMvcTest` controller unit tests |
| 5 | 🟠 High | Security | Restrict WebSocket `allowedOriginPatterns` to `cors.allowed-origins` property |
| 6 | 🟠 High | Security | Move JWT storage from `localStorage` to `HttpOnly` cookies or document the risk |
| 7 | 🟠 High | DevOps | Add backend CI pipeline (`mvn verify` on every PR) |
| 8 | 🟡 Medium | Code Quality | Fix double toast — remove `toast.error` from Axios response interceptor |
| 9 | 🟡 Medium | Testing | Fix or replace the no-op `testValidateExpiredToken` test |
| 10 | 🟡 Medium | Code Quality | Fix stale `useEffect` deps in `useSessionWebSocket` and remove ESLint suppression |
| 11 | 🟡 Medium | Security | Add rate limiting on session create and join endpoints |
| 12 | 🟡 Medium | Database | Cascade soft-delete (or hard-delete) to orphaned users/votes/stories |
| 13 | 🟡 Medium | DevOps | Add `Dockerfile` for backend and frontend services |
| 14 | 🟡 Medium | Frontend | Add Vitest for component and utility unit testing |
| 15 | 🟡 Medium | Code Quality | Add backend validation for `CUSTOM` sizing values |
| 16 | 🟢 Low | Database | Add explicit DB indexes on `session_id` FK columns |
| 17 | 🟢 Low | Database | Replace `LocalDateTime` with `OffsetDateTime` for proper timezone handling |
| 18 | 🟢 Low | Architecture | Add `Pageable` to collection repository queries |
| 19 | 🟢 Low | DevOps | Replace `sleep 10` in `start.sh` with a backend health-check loop |
| 20 | 🟢 Low | Testing | Add `data-testid` attributes to replace fragile text-based E2E selectors |

---

## 10. Remediation Effort Estimates

| Work Item | Estimated Effort |
|---|---|
| Critical security fixes (items 1, 3, 5, 6) | ~4 hours |
| JPA entity `@Data` refactoring (item 2) | ~2 hours |
| Backend unit + integration tests (items 4, 9) | ~2–3 days |
| Frontend unit tests with Vitest (item 14) | ~1 day |
| Backend CI pipeline (item 7) | ~2 hours |
| Docker files for both services (item 13) | ~3 hours |
| Rate limiting (item 11) | ~4 hours |
| All medium-priority code quality fixes (items 8, 10, 12, 15) | ~4 hours |
| All low-priority items (items 16–20) | ~1 day |
| **Total estimated effort** | **~6–8 developer days** |

---

## 11. Positive Highlights

- Clean layered architecture with well-named abstractions throughout the backend.
- Comprehensive Swagger/OpenAPI annotations on every controller — excellent API discoverability.
- `VoteStatisticsCalculator` is properly extracted as a single-responsibility service, reused by
  both `AnalyticsService` and `SessionServiceImpl`.
- `GlobalExceptionHandler` handles every custom exception type with a consistent response shape.
- Production profile is properly hardened: no H2 console, no debug SQL, Flyway enabled, all secrets
  via environment variables with no fallback defaults.
- E2E tests with Playwright cover the full user journey (create → join → vote → reveal) across
  isolated browser contexts.
- `SessionContext` reducer pattern with localStorage persistence is well-implemented and SSR-safe.
- `WebSocketAuthInterceptor` correctly authenticates STOMP `CONNECT` frames using the JWT.
- Dark mode via `useTheme` hook and Tailwind is a polished UX touch.
- `FUTURE_FEATURES.md` demonstrates honest self-awareness about current technical gaps.
