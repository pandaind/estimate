# 02 — REST Controllers

## The web layer's job

A REST controller's only responsibility is to:
1. Receive an HTTP request
2. Extract and validate the input
3. Call the service layer
4. Return an HTTP response (usually JSON)

Controllers should contain **no business logic**. That goes in the service layer.

## How Spring MVC works

```
HTTP Request
  → DispatcherServlet (Spring's front controller)
    → HandlerMapping (finds the right controller method)
      → JwtAuthenticationFilter (validates JWT — before controller)
        → SessionController.getSession()
          → return ResponseEntity<SessionDTO>
            → Jackson serialises to JSON
              → HTTP Response 200 OK + JSON body
```

## Core annotations

### `@RestController`

```java
@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    // ...
}
```

`@RestController` = `@Controller` + `@ResponseBody`. It means:
- This class handles HTTP requests.
- The return value is serialised directly to the response body (JSON), not rendered as a view.

`@RequestMapping("/api/sessions")` sets the **base path** for all methods in this class.

### HTTP method annotations

```java
@GetMapping("/{code}")           // GET  /api/sessions/{code}
@PostMapping                     // POST /api/sessions
@PutMapping("/{code}") 	         // PUT  /api/sessions/{code}
@DeleteMapping("/{code}/stories/{id}")  // DELETE ...
@PatchMapping("/{code}/settings")       // PATCH ...
```

Each one maps a URL path + HTTP method to a Java method.

### Path variables

```java
@GetMapping("/{code}/stories/{storyId}")
public ResponseEntity<StoryDTO> getStory(
    @PathVariable String code,
    @PathVariable Long storyId
) {
    // code  → from URL path segment {code}
    // storyId → from URL path segment {storyId}
}
```

### Request body

Incoming JSON is automatically deserialised into a Java object:

```java
@PostMapping
public ResponseEntity<SessionDTO> createSession(
    @RequestBody @Valid CreateSessionRequest request
) {
    // 'request' is populated from JSON body
    // @Valid triggers Bean Validation
}
```

`@Valid` is key — it runs validation annotations on the `CreateSessionRequest` class (like `@NotBlank`, `@Size`, `@Min`) and returns 400 with error details if validation fails.

### Request parameters (query string)

```java
// GET /api/sessions/ABC123/stories?status=ESTIMATED
@GetMapping
public ResponseEntity<List<StoryDTO>> getStories(
    @PathVariable String code,
    @RequestParam(required = false) String status
) {
    // status is null if not provided (required = false)
}
```

## `ResponseEntity` — full control of the response

```java
return ResponseEntity.ok(dto);                    // 200 OK + body
return ResponseEntity.status(201).body(dto);       // 201 Created + body
return ResponseEntity.created(location).body(dto); // 201 + Location header
return ResponseEntity.noContent().build();         // 204 No Content (after delete)
return ResponseEntity.notFound().build();          // 404 (though exceptions handle this)
```

## A complete controller example — `SessionController`

Simplified view of the real controller:

```java
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor  // Lombok: generates constructor for final fields
public class SessionController {

    private final ISessionService sessionService;  // injected via constructor

    // POST /api/sessions — create a new session
    @PostMapping
    public ResponseEntity<SessionDTO> createSession(@RequestBody @Valid CreateSessionRequest req) {
        SessionDTO created = sessionService.createSession(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET /api/sessions/{code} — get session by code
    @GetMapping("/{code}")
    public ResponseEntity<SessionDTO> getSession(@PathVariable String code) {
        SessionDTO session = sessionService.getSession(code);
        return ResponseEntity.ok(session);
    }

    // POST /api/sessions/{code}/join — join a session
    @PostMapping("/{code}/join")
    public ResponseEntity<JoinSessionResponse> joinSession(
        @PathVariable String code,
        @RequestBody @Valid JoinSessionRequest req
    ) {
        JoinSessionResponse response = sessionService.joinSession(code, req);
        return ResponseEntity.ok(response);
    }

    // POST /api/sessions/{code}/reveal — reveal all votes
    @PostMapping("/{code}/reveal")
    public ResponseEntity<Void> revealVotes(@PathVariable String code) {
        sessionService.revealVotes(code);
        return ResponseEntity.noContent().build();
    }
}
```

## DTOs — Data Transfer Objects

Controllers never pass JPA entity objects directly. **DTOs** are plain Java classes that define the exact shape of the API:

```java
// Request DTO — shapes what the client sends
public class CreateSessionRequest {
    @NotBlank(message = "Session name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull
    private SizingMethod sizingMethod;
}

// Response DTO — shapes what the server returns
public class SessionDTO {
    private Long id;
    private String sessionCode;
    private String name;
    private String description;
    private SizingMethod sizingMethod;
    private boolean isActive;
    // NO: no sensitive fields, no lazy-loaded collections
}
```

**Why DTOs instead of entities?**
- Decouples the API contract from the database schema — you can change one without breaking the other.
- Prevents over-fetching (don't accidentally expose a `password` field).
- Avoids Jackson serialisation issues with Hibernate lazy proxies.
- Lets you shape the response differently from the DB structure.

## Getting the authenticated user from the request

After JWT validation, Spring Security stores the user info in the security context. Get it in a controller method with `@AuthenticationPrincipal`:

```java
@PostMapping("/{code}/stories")
public ResponseEntity<StoryDTO> createStory(
    @PathVariable String code,
    @RequestBody @Valid CreateStoryRequest req,
    @AuthenticationPrincipal UserDetails principal
) {
    // principal.getUsername() is the userId that JwtTokenService put in the token
    String userId = principal.getUsername();
    // ...
}
```

Alternatively, controllers in this project use a `SessionAccessValidator` that checks the JWT claims directly to ensure the user belongs to the requested session.

## Bean Validation annotations

```java
@NotNull              // must not be null
@NotBlank             // must not be null, empty, or whitespace
@NotEmpty             // must not be null or empty
@Size(min=1, max=50)  // string/collection length
@Min(1) @Max(10)      // numeric range
@Email                // valid email format
@Pattern(regexp="...") // custom regex
```

When `@Valid` is present and validation fails, Spring returns a `400 Bad Request` automatically. The `GlobalExceptionHandler` formats this into the standard error response.

## The full controller list

| File | Base path | Main operations |
|------|-----------|-----------------|
| `SessionController` | `/api/sessions` | CRUD, join, leave, reveal, reset |
| `StoryController` | `/api/sessions/{code}/stories` | CRUD, activate, finalize, reset |
| `VoteController` | `/api/sessions/{code}/stories/{id}/votes` | cast, get, delete |
| `UserController` | `/api/sessions/{code}/users` | get all users, update profile |
| `AnalyticsController` | `/api/sessions/{code}/analytics` | session/story analytics |
| `ExportController` | `/api/sessions/{code}/export`, `/import` | export JSON/CSV, import JSON |

## Key takeaways

- `@RestController` + `@RequestMapping` define the URL base for a class.
- `@GetMapping`, `@PostMapping` etc. map specific endpoints to methods.
- `@PathVariable` extracts segments from the URL; `@RequestBody` deserialises JSON input.
- `@Valid` triggers Bean Validation — invalid input returns 400 automatically.
- Always use DTOs, not entities, as controller input/output.
- `ResponseEntity` lets you control the exact HTTP status code and headers.
- Controllers call services — no business logic in controllers.

---
**Next:** [03 — The Service Layer](03-service-layer.md)
