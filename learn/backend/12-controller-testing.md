# 12 — Controller Testing with @WebMvcTest

## Why test controllers separately?

Unit tests (covered in [09-testing.md](09-testing.md)) verify **service logic** in isolation. Controller tests verify a different layer:

- **Route mapping** — does `GET /api/sessions/{code}` hit the right method?
- **Request parsing** — does `@RequestBody` deserialize correctly?
- **Response format** — does the JSON match the expected structure?
- **Security** — do unauthenticated requests get rejected?
- **Status codes** — does creation return `201`, deletion return `204`, not found return `404`?

Spring Boot provides `@WebMvcTest` — a **slice test** that boots only the web layer (controllers, filters, security config) without starting JPA, services, or the database.

---

## Setting up a @WebMvcTest

### Basic structure

```java
@WebMvcTest(SessionController.class)   // Only load this one controller
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})  // Real security
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;  // Simulated HTTP client

    @MockBean private SessionService sessionService;       // Mocked service
    @MockBean private JwtTokenService jwtTokenService;     // Needed by real filter
    @MockBean private SessionAccessValidator sessionAccessValidator;  // Needed by @PreAuthorize
}
```

### Key annotations

| Annotation | Purpose |
|---|---|
| `@WebMvcTest(XController.class)` | Boots only the web slice for one controller |
| `@Import({...})` | Brings in configuration classes the slice needs |
| `@MockBean` | Creates a Mockito mock and registers it in the Spring context |
| `@WithMockUser` | Simulates an authenticated user (from `spring-security-test`) |

### Required dependency

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Why @Import instead of @MockBean for security filters?

We initially tried mocking the `JwtAuthenticationFilter`:

```java
// ❌ BROKEN — causes NPE
@MockBean
private JwtAuthenticationFilter jwtAuthenticationFilter;
```

This fails with a `NullPointerException` because `JwtAuthenticationFilter` extends `OncePerRequestFilter` → `GenericFilterBean`, which initializes a `logger` field in its constructor. A Mockito mock **skips constructors**, so `this.logger` is `null`. When Spring calls `filter.init()`, it crashes:

```
Cannot invoke "org.apache.commons.logging.Log.isDebugEnabled()"
because "this.logger" is null
```

### The solution: Import the real filter, mock its dependencies

```java
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
// ↑ Real filter (constructor runs, logger is initialized)

@MockBean private JwtTokenService jwtTokenService;
// ↑ The filter calls this to validate tokens — mock returns null/false
//   so all requests act as unauthenticated unless @WithMockUser is used
```

This gives us **real security behavior** (the actual filter chain runs) with **controlled authentication** (mocked token service).

---

## Writing tests

### Happy path — authenticated request

```java
@Test
@WithMockUser(roles = "USER")
void getSession_withValidCode_returns200() throws Exception {
    SessionResponse response = new SessionResponse();
    response.setSessionCode("ABC123");
    response.setName("Sprint Planning");

    when(sessionService.getSession("ABC123")).thenReturn(response);

    mockMvc.perform(get("/api/sessions/ABC123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionCode").value("ABC123"))
            .andExpect(jsonPath("$.name").value("Sprint Planning"));
}
```

### Security — unauthenticated access

```java
@Test
void getSession_unauthenticated_returns403() throws Exception {
    mockMvc.perform(get("/api/sessions/ABC123"))
            .andExpect(status().isForbidden());
}
```

> **Important**: Spring Security returns **403 Forbidden** (not 401 Unauthorized) for anonymous requests when no `AuthenticationEntryPoint` is configured. This is a common source of confusion — the framework defaults to access-denied for unrecognized identities.

### POST with JSON body

```java
@Test
@WithMockUser(roles = "USER")
void createSession_withValidRequest_returns201() throws Exception {
    CreateSessionRequest request = new CreateSessionRequest();
    request.setName("New Sprint");

    CreateSessionResponse response = new CreateSessionResponse();
    response.setSessionCode("XYZ789");

    when(sessionService.createSession(any())).thenReturn(response);

    mockMvc.perform(post("/api/sessions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.sessionCode").value("XYZ789"));
}
```

### Testing different roles

```java
@Test
@WithMockUser(roles = "ADMIN")
void deleteSession_asAdmin_returns204() throws Exception {
    doNothing().when(sessionService).deleteSession("ABC123");

    mockMvc.perform(delete("/api/sessions/ABC123"))
            .andExpect(status().isNoContent());
}
```

---

## Common patterns

### MockMvc verbs

```java
mockMvc.perform(get("/api/sessions/ABC123"))
mockMvc.perform(post("/api/sessions").contentType(...).content(...))
mockMvc.perform(put("/api/sessions/ABC123").contentType(...).content(...))
mockMvc.perform(delete("/api/sessions/ABC123"))
```

### Response assertions

```java
.andExpect(status().isOk())           // 200
.andExpect(status().isCreated())      // 201
.andExpect(status().isNoContent())    // 204
.andExpect(status().isForbidden())    // 403
.andExpect(status().isNotFound())     // 404

.andExpect(jsonPath("$.name").value("Sprint"))
.andExpect(jsonPath("$.stories").isArray())
.andExpect(jsonPath("$.stories", hasSize(3)))
```

### CSRF

EstiMate's `SecurityConfig` disables CSRF (stateless JWT API), so **no `.with(csrf())` is needed**. If your app uses session-based auth, you'd need:

```java
mockMvc.perform(post("/api/something").with(csrf()))
```

---

## Known limitation: @PreAuthorize with SpEL bean references

`@PreAuthorize` expressions that reference Spring beans and method parameters via SpEL:

```java
@PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")
```

…may fail in `@WebMvcTest` context because the CGLIB proxy used by `@EnableMethodSecurity` can't resolve `#paramName` from the controller method signature. This works fine in full integration tests (`@SpringBootTest`) but requires workarounds in slice tests.

**Workaround**: Test these endpoints with unauthenticated-access tests (verify 403) and cover the authorization logic in integration tests.

---

## Test file organization

```
backend/src/test/java/com/pandac/planningpoker/
  controller/
    SessionControllerTest.java       ← 13 tests
    StoryControllerTest.java         ← 9 tests
    VoteControllerTest.java          ← 4 tests
    UserControllerTest.java          ← 4 tests
    AnalyticsControllerTest.java     ← 4 tests
    ExportControllerTest.java        ← 5 tests
  service/
    SessionServiceImplTest.java      ← Unit tests (Mockito)
    StoryServiceImplTest.java
    VoteServiceImplTest.java
  security/
    JwtTokenServiceTest.java
```

Controller tests and service tests complement each other:

| Layer | What it tests | Boot time |
|---|---|---|
| Service test (`@ExtendWith(MockitoExtension.class)`) | Business logic rules | ~0ms (no Spring) |
| Controller test (`@WebMvcTest`) | HTTP layer + security | ~1-2s (web slice) |
| Integration test (`@SpringBootTest`) | Full stack | ~5-10s (full context) |

---

## Compatibility notes

### Spring Boot 3.5+ and JDK 25

- **Lombok 1.18.44+** is required for JDK 25 — older versions crash with `TypeTag :: UNKNOWN`
- **Spring Boot 3.5.12** (Spring Framework 6.2.17) fixes `GenericFilterBean` mock issues
- The `@MockBean` import is `org.springframework.boot.test.mock.mockito.MockBean` (not `.mock.bean.MockBean`)
