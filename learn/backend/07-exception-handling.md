# 07 — Global Exception Handling

## The problem without a global handler

Without centralised error handling, every service method would need:

```java
try {
    Session session = sessionRepository.findBySessionCode(code)
        .orElse(null);
    if (session == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
    }
    // ...
} catch (Exception e) {
    return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
}
```

This is repetitive, inconsistent, and leaks stack traces. Instead, EstiMate uses a **global exception handler** — one place that handles all exceptions uniformly.

## Custom exception classes

Define one exception class per domain error:

```java
// SessionNotFoundException.java
public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException(String code) {
        super("Session not found: " + code);
    }
}

// StoryNotFoundException.java
public class StoryNotFoundException extends RuntimeException {
    public StoryNotFoundException(Long storyId) {
        super("Story not found: " + storyId);
    }
}

// InvalidVoteException.java
public class InvalidVoteException extends RuntimeException {
    public InvalidVoteException(String message) {
        super(message);
    }
}

// UnauthorizedAccessException.java
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
```

These extend `RuntimeException` (unchecked) — they propagate up the call stack without being declared in `throws` clauses. When they bubble up to the controller layer, the global handler catches them.

Usage in services:
```java
Session session = sessionRepository.findBySessionCode(code)
    .orElseThrow(() -> new SessionNotFoundException(code));
// One line — clean and readable
```

## `@RestControllerAdvice` — the global handler

```java
@RestControllerAdvice   // applies to ALL @RestController classes
@Slf4j
public class GlobalExceptionHandler {

    // Called when SessionNotFoundException is thrown anywhere
    @ExceptionHandler(SessionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleSessionNotFound(SessionNotFoundException ex) {
        log.warn("Session not found: {}", ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)    // 404
            .body(new ErrorResponse("SESSION_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(StoryNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleStoryNotFound(StoryNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("STORY_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedAccessException ex) {
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)    // 403
            .body(new ErrorResponse("FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(InvalidVoteException.class)
    public ResponseEntity<ErrorResponse> handleInvalidVote(InvalidVoteException ex) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)  // 400
            .body(new ErrorResponse("INVALID_VOTE", ex.getMessage()));
    }

    // Bean validation failures (@Valid @RequestBody) — 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_FAILED", details));
    }

    // Catch-all — prevents stack traces leaking in production
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)  // 500
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

## `ErrorResponse` — the standard error shape

```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;        // machine-readable code: "SESSION_NOT_FOUND"
    private String message;     // human-readable: "Session not found: ABC123"
    private LocalDateTime timestamp = LocalDateTime.now();

    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
```

The frontend receives JSON like:
```json
{
  "code": "SESSION_NOT_FOUND",
  "message": "Session not found: ABC123",
  "timestamp": "2026-03-16T10:30:00"
}
```

The Axios response interceptor shows the `message` in a toast notification. The `code` field lets the frontend make programmatic decisions (e.g., `code === "SESSION_NOT_FOUND"` → redirect home).

## HTTP status code reference

| Code | Name | When to use |
|------|------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST that created a resource |
| 204 | No Content | Successful DELETE or action with no response body |
| 400 | Bad Request | Validation failure, invalid input |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Valid JWT but no permission for this resource |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., user already voted) |
| 500 | Internal Server Error | Unexpected server error |

## Exception hierarchy in EstiMate

```
RuntimeException
  ├── ResourceNotFoundException        (generic base)
  │    ├── SessionNotFoundException    → 404
  │    ├── StoryNotFoundException      → 404
  │    └── UserNotFoundException       → 404
  ├── InvalidVoteException             → 400
  ├── NoActiveStoryException           → 400
  ├── SessionMembershipException       → 400 or 403
  └── UnauthorizedAccessException      → 403
```

Grouping `NotFoundException` types under a common base makes it possible to add a handler for all not-found errors at once if needed.

## Throwing exceptions in services — the complete flow

```
GET /api/sessions/BADCODE
  → JwtAuthFilter: token valid ✓
  → StoryController.getStories("BADCODE")
    → sessionRepository.findBySessionCode("BADCODE")
      → returns Optional.empty()  (not in DB)
    → .orElseThrow(() -> new SessionNotFoundException("BADCODE"))
      → exception propagates up the call stack
    → [no try/catch in controller]
  → GlobalExceptionHandler.handleSessionNotFound()
    → ResponseEntity<ErrorResponse>(404, { code: "SESSION_NOT_FOUND", message: "..." })
→ Response: 404 Not Found + JSON body
```

No `try/catch` in the controller. The exception handler catches it transparently.

## Logging best practices

```java
log.error("DB connection failed", exception);   // unexpected — log full stack trace
log.warn("Session not found: {}", code);        // expected but notable — message only
log.info("User {} joined session {}", userId, code); // normal operations
log.debug("Cache hit for key: {}", key);        // verbose — only in debug mode
```

Level hierarchy: `TRACE < DEBUG < INFO < WARN < ERROR`  
Default log level in Spring Boot: `INFO` (only `INFO`, `WARN`, `ERROR` appear).

In the exception handler, `NOT_FOUND` exceptions use `log.warn` (expected, no stack trace needed). Generic exceptions use `log.error` with the exception itself (to capture the full stack trace).

## Spring's built-in exceptions

Spring and JPA automatically throw some exceptions:

| Exception | When | Mapped to |
|-----------|------|-----------|
| `MethodArgumentNotValidException` | `@Valid` fails | 400 |
| `HttpMessageNotReadableException` | Malformed JSON body | 400 |
| `HttpRequestMethodNotSupportedException` | Wrong HTTP method | 405 |
| `NoHandlerFoundException` | URL not mapped | 404 |
| `DataIntegrityViolationException` | DB constraint violation | 409 or 400 |

Add handlers for these if you want them in your standard error format.

## Key takeaways

- Custom exceptions make service code clean: throw a named exception, handle it centrally.
- `@RestControllerAdvice` + `@ExceptionHandler` is the single place that turns exceptions into HTTP responses.
- Every exception class maps to an appropriate HTTP status code.
- `ErrorResponse` gives a consistent JSON shape: `code` (machine-readable) + `message` (human-readable).
- The catch-all `Exception` handler prevents stack traces reaching clients in production.
- Use `log.warn` for expected business errors, `log.error` for unexpected exceptions.

---
**Next:** [08 — Database, Flyway, and Environments](08-database-flyway.md)
