# 03 — The Service Layer

## Why a service layer?

The **service layer** sits between controllers (web) and repositories (database). It contains the **business rules** of the application.

Without a service layer, business logic leaks into controllers, controllers become hard to test, and the same logic gets duplicated. The service layer enforces this separation:

```
Request → Controller  →  Service   →  Repository →  Database
          (HTTP)        (business     (SQL)
                         logic)
```

Rules:
- Controllers call services; controllers never call repositories directly.
- Services call repositories; services don't know about HTTP.
- Repositories only do database operations; no business logic.

## Dependency Injection — how Spring wires things together

Instead of creating objects with `new`, you declare what you **need** and Spring provides it.

```java
@Service
public class SessionServiceImpl implements ISessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final WebSocketEventPublisher wsPublisher;

    // Constructor injection — Spring calls this with the right instances
    public SessionServiceImpl(
        SessionRepository sessionRepository,
        UserRepository userRepository,
        WebSocketEventPublisher wsPublisher
    ) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.wsPublisher = wsPublisher;
    }
}
```

This is **constructor injection** — the recommended style. When Spring creates `SessionServiceImpl`, it automatically passes the matching singleton beans.

With **Lombok's `@RequiredArgsConstructor`**, the boilerplate constructor is generated automatically:

```java
@Service
@RequiredArgsConstructor  // generates constructor for final fields
public class SessionServiceImpl implements ISessionService {

    private final SessionRepository sessionRepository;  // final = required
    private final UserRepository userRepository;
    private final WebSocketEventPublisher wsPublisher;
    // no constructor written — Lombok generates it
}
```

## Interface-based design

Every service in this project implements an interface:

```java
// ISessionService.java
public interface ISessionService {
    SessionDTO createSession(CreateSessionRequest request);
    SessionDTO getSession(String code);
    JoinSessionResponse joinSession(String code, JoinSessionRequest request);
    void revealVotes(String code);
    // ...
}

// SessionServiceImpl.java
@Service
public class SessionServiceImpl implements ISessionService {
    @Override
    public SessionDTO createSession(CreateSessionRequest request) {
        // actual implementation
    }
}
```

**Why interfaces?**
- **Testability**: In unit tests, you can use a mock that implements the interface instead of the real implementation — no database needed.
- **Clarity**: The interface documents the contract (what operations exist) separately from how they work.
- **Flexibility**: You could swap implementations (e.g., a caching wrapper) without changing the controller.

In the controller:
```java
private final ISessionService sessionService;  // interface type, not the impl
```

Spring injects the `SessionServiceImpl` because it's the only class implementing `ISessionService`.

## `@Transactional` — database transaction management

A transaction ensures that a group of database operations either **all succeed** or **all fail** together (atomicity).

```java
@Transactional
public SessionDTO createSession(CreateSessionRequest request) {
    // All of this runs in one transaction:
    Session session = new Session();
    session.setName(request.getName());
    Session saved = sessionRepository.save(session);  // INSERT sessions

    User moderator = new User();
    moderator.setSession(saved);
    moderator.setModerator(true);
    User savedUser = userRepository.save(moderator);  // INSERT users

    saved.setModeratorId(savedUser.getId());
    sessionRepository.save(saved);  // UPDATE sessions

    return toDTO(saved);
    // Transaction COMMITS here (all changes written to DB)
    // If any exception was thrown: transaction ROLLS BACK (nothing written)
}
```

Without `@Transactional`, each `save()` call is its own transaction. If the second `save()` fails, the first one is already committed — you'd have a session with no moderator.

`@Transactional` on a class applies to all public methods. On a method, it applies only to that method.

Read-only operations:
```java
@Transactional(readOnly = true)  // optimisation hint for the database
public SessionDTO getSession(String code) {
    return sessionRepository.findBySessionCode(code)
        .map(this::toDTO)
        .orElseThrow(() -> new SessionNotFoundException(code));
}
```

## A complete service method — joining a session

```java
@Override
@Transactional
public JoinSessionResponse joinSession(String code, JoinSessionRequest request) {

    // 1. Find the session (throws 404 if not found)
    Session session = sessionRepository.findBySessionCode(code)
        .orElseThrow(() -> new SessionNotFoundException(code));

    // 2. Business rule: session must be active
    if (!session.isActive()) {
        throw new InvalidVoteException("Session is not accepting new participants");
    }

    // 3. Create the user entity
    User user = User.builder()
        .name(request.getName())
        .session(session)
        .isObserver(request.isObserver())
        .isModerator(false)
        .isActive(true)
        .joinedAt(LocalDateTime.now())
        .build();

    User savedUser = userRepository.save(user);

    // 4. Generate JWT for this user
    String token = jwtTokenService.generateToken(savedUser.getId(), session.getSessionCode());

    // 5. Notify all other participants via WebSocket
    wsPublisher.publishUserJoined(code, toDTO(savedUser));

    // 6. Return response with token (frontend stores this)
    return JoinSessionResponse.builder()
        .session(toDTO(session))
        .user(toDTO(savedUser))
        .token(token)
        .build();
}
```

Notice the clear sequence: validate → operate → persist → notify → respond. Each step is in the right layer.

## `PlanningPokerService` — the orchestrator

For complex operations that span multiple domain services, an **orchestrator service** coordinates them:

```java
@Service
@RequiredArgsConstructor
public class PlanningPokerService {

    private final ISessionService sessionService;
    private final IStoryService storyService;
    private final IVoteService voteService;

    public void completeVotingRound(String sessionCode, Long storyId, String finalEstimate) {
        // 1. Record the final estimate on the story
        storyService.finalizeStory(sessionCode, storyId, finalEstimate);
        // 2. Update session's current story (clear it)
        sessionService.clearCurrentStory(sessionCode);
        // 3. Analytics update (could go via events instead)
    }
}
```

This keeps individual services focused while providing high-level use-case methods.

## `VoteStatisticsCalculator` — extracted utility

When a calculation is needed in multiple services, it's extracted into a separate `@Component`:

```java
@Component
public class VoteStatisticsCalculator {

    public VoteStatistics calculate(List<Vote> votes) {
        if (votes.isEmpty()) return VoteStatistics.empty();

        // numeric votes only (exclude "?" and coffee)
        List<Double> numeric = votes.stream()
            .filter(v -> isNumeric(v.getEstimate()))
            .map(v -> Double.parseDouble(v.getEstimate()))
            .sorted()
            .collect(Collectors.toList());

        return VoteStatistics.builder()
            .average(average(numeric))
            .median(median(numeric))
            .min(numeric.isEmpty() ? null : numeric.get(0))
            .max(numeric.isEmpty() ? null : numeric.get(numeric.size() - 1))
            .totalVotes(votes.size())
            .build();
    }
}
```

Both `AnalyticsService` and `VoteServiceImpl` inject this component.

## Entity-to-DTO mapping

Services convert between JPA entities (database representation) and DTOs (API representation):

```java
private SessionDTO toDTO(Session session) {
    return SessionDTO.builder()
        .id(session.getId())
        .sessionCode(session.getSessionCode())
        .name(session.getName())
        .isActive(session.isActive())
        .votesRevealed(session.isVotesRevealed())
        .settings(settingsToDTO(session.getSettings()))
        .build();
}
```

Mapping is intentionally explicit — you choose exactly which fields to expose. Never call `session.getUsers()` here if users is a lazy collection and you don't need it in this response.

## Key takeaways

- The service layer contains business rules; controllers and repositories don't.
- Inject dependencies via constructor (Lombok's `@RequiredArgsConstructor` removes boilerplate).
- Design services around interfaces (`ISessionService`) for testability.
- `@Transactional` wraps operations in a database transaction — rollbacks on exception.
- Throw domain-specific exceptions when business rules are violated; the global handler converts them to HTTP responses.
- Map entities to DTOs in the service layer — never expose JPA entities directly from controllers.

---
**Next:** [04 — JPA Entities and Spring Data](04-jpa-entities.md)
