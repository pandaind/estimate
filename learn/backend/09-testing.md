# 09 — Unit Testing with JUnit 5 and Mockito

## Why unit tests?

A unit test validates one unit of behaviour in isolation — one method, one rule — without starting a database, web server, or any external system.

Benefits:
- **Fast feedback**: tests run in milliseconds (no Spring context to boot)
- **Safe refactoring**: tests catch regressions the moment they happen
- **Living documentation**: a test named `castVote_observer_throwsInvalidVoteException` explains business rules better than a comment
- **Forces good design**: code that is hard to test is usually poorly designed

EstiMate uses **JUnit 5** (the test runner) and **Mockito** (the mocking library).

---

## JUnit 5 — the test runner

### Basic structure

```java
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class SessionServiceImplTest {

    @Test
    void createSession_withFibonacci_returnsModeratorToken() {
        // Given — set up the input
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Sprint 1");
        request.setSizingMethod(SizingMethod.FIBONACCI);

        // When — call the method under test
        CreateSessionResponse response = sessionService.createSession(request);

        // Then — assert the outcome
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotBlank();
    }
}
```

The **Given / When / Then** (or Arrange / Act / Assert) pattern keeps every test readable.

### Lifecycle annotations

```java
@BeforeEach   // runs before each @Test method — ideal for shared setup
void setUp() {
    session = new Session();
    session.setId(1L);
    session.setSessionCode("ABC123");
}

@AfterEach    // runs after each test — useful for cleanup
void tearDown() { ... }

@BeforeAll    // runs once before the entire class (static method needed)
@AfterAll     // runs once after the entire class
```

### Assertion library — AssertJ

JUnit ships with basic assertions (`assertEquals`, `assertTrue`). EstiMate uses **AssertJ** which has a fluent, readable API:

```java
// JUnit style — less readable
assertEquals("ABC123", session.getSessionCode());
assertTrue(response.getToken() != null);

// AssertJ style — reads like English
assertThat(session.getSessionCode()).isEqualTo("ABC123");
assertThat(response.getToken()).isNotBlank();
assertThat(stories).hasSize(3);
assertThat(stories).extracting(Story::getTitle).contains("Login", "Dashboard");

// Exception assertions
assertThatThrownBy(() -> voteService.castVote("X", 1L, 99L, request))
        .isInstanceOf(UserNotFoundException.class);

assertThatNoException().isThrownBy(() -> sessionService.createSession(validRequest));
```

---

## Mockito — replacing dependencies with fakes

A service like `SessionServiceImpl` depends on `SessionRepository`, `UserRepository`, `JwtTokenService`, and others. Running these for real would require a database.

**Mockito** creates fake implementations — **mocks** — that return whatever you tell them to, without touching a database.

### Setting up mocks with `@ExtendWith(MockitoExtension.class)`

```java
@ExtendWith(MockitoExtension.class)   // tells JUnit to run Mockito's extension
class SessionServiceImplTest {

    @Mock SessionRepository sessionRepository;   // Mockito creates a fake
    @Mock UserRepository userRepository;
    @Mock JwtTokenService jwtTokenService;
    @Mock WebSocketEventPublisher webSocketEventPublisher;

    @InjectMocks SessionServiceImpl sessionService;
    // @InjectMocks: creates the real service and injects the mocks above into it
```

`@Mock` creates a fake where every method returns `null` (or empty Optional, empty list) by default.

`@InjectMocks` creates the real `SessionServiceImpl` and wires the mocked dependencies into its constructor (same as Spring's dependency injection, but done by Mockito).

### Stubbing — telling mocks what to return

```java
// "when this method is called with these args, return this"
when(sessionRepository.findBySessionCodeAndIsActive("ABC123", true))
        .thenReturn(Optional.of(session));

// Argument matchers — match any value of that type
when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);
when(jwtTokenService.generateToken(anyString(), anyLong(), any())).thenReturn("fake-token");

// Void methods — do nothing (default) or configure behaviour
doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
doThrow(new UnauthorizedException("Not a member"))
        .when(sessionAccessValidator).requireUserBelongsToSession(stranger, session);
```

### Verification — confirming a method was called

```java
// Verify save was called at least once
verify(sessionRepository, atLeastOnce()).save(any(Session.class));

// Verify exactly once
verify(userRepository).save(any(User.class));

// Verify never called
verify(webSocketEventPublisher, never()).votesRevealed(any(), any());
```

---

## How EstiMate's service tests are structured

### `SessionServiceImplTest`

Tests for `SessionServiceImpl` — the core session lifecycle:

```java
// createSession — happy path
@Test
void createSession_withFibonacci_savesSessionAndReturnsModerator() {
    // Stub: no duplicate session code exists
    when(sessionRepository.findBySessionCode(anyString())).thenReturn(Optional.empty());
    // Stub: repository returns the entity we built
    when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);
    when(jwtTokenService.generateToken(anyString(), anyLong(), any())).thenReturn("token");

    CreateSessionResponse response = sessionService.createSession(request);

    assertThat(response.getToken()).isEqualTo("token");
    verify(userRepository).save(any(User.class));   // moderator user was saved
}

// createSession — validation guard
@Test
void createSession_withCustomSizingAndNoValues_throwsIllegalArgument() {
    request.setSizingMethod(SizingMethod.CUSTOM);
    request.setCustomValues(new String[]{});        // empty — should be rejected

    assertThatThrownBy(() -> sessionService.createSession(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("CUSTOM sizing method requires at least one value");
}

// getSession — not found path
@Test
void getSession_unknownCode_throwsSessionNotFoundException() {
    when(sessionRepository.findBySessionCodeAndIsActive("XXXXXX", true))
            .thenReturn(Optional.empty());

    assertThatThrownBy(() -> sessionService.getSession("XXXXXX"))
            .isInstanceOf(SessionNotFoundException.class);
}
```

### `VoteServiceImplTest`

Tests the business rules around voting:

```java
// Observer blocked
@Test
void castVote_observer_throwsInvalidVoteException() {
    voter.setIsObserver(true);
    // ... stubs ...
    assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 5L, request))
            .isInstanceOf(InvalidVoteException.class)
            .hasMessageContaining("Observers cannot vote");
}

// Vote change blocked after reveal when not allowed
@Test
void castVote_voteChangeNotAllowedAfterReveal_throwsInvalidVoteException() {
    session.getSettings().setAllowChangeVote(false);
    session.setVotesRevealed(true);
    when(voteRepository.findByStoryAndUser(story, voter))
            .thenReturn(Optional.of(existingVote));  // vote already exists

    assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 5L, request))
            .isInstanceOf(InvalidVoteException.class)
            .hasMessageContaining("Vote changes are not allowed after reveal");
}
```

### `StoryServiceImplTest`

Tests story creation and retrieval:

```java
// Order index is computed from current list size
@Test
void createStory_orderIndexIsSetToCurrentListSize() {
    when(storyRepository.findBySessionOrderByOrderIndex(session))
            .thenReturn(List.of(existingStory1, existingStory2));  // 2 existing stories

    when(storyRepository.save(any(Story.class))).thenAnswer(inv -> {
        Story s = inv.getArgument(0);
        assertThat(s.getOrderIndex()).isEqualTo(2);   // index = list size
        return saved;
    });

    storyService.createStory("SES001", request);
}
```

`thenAnswer` is used when you need to inspect the actual object passed to the mock, not just the return value.

---

## Java 25 / Mockito compatibility

Mockito's default "inline" mock maker uses Java bytecode manipulation (via `byte-buddy`) which breaks on newer JVM versions. EstiMate uses the **subclass** mock maker instead:

```
# backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker
mock-maker-subclass
```

This file is automatically discovered by Mockito at startup. No code change is needed — just the file in the right place.

Additionally, `pom.xml` opens internal JDK packages so Mockito's reflection works on Java 25+:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>
            --add-opens java.base/java.lang=ALL-UNNAMED
            --add-opens java.base/java.util=ALL-UNNAMED
            --add-opens java.base/java.lang.reflect=ALL-UNNAMED
        </argLine>
    </configuration>
</plugin>
```

---

## Running backend tests

```bash
# Run all tests
mvn test

# Run one test class
mvn test -Dtest=SessionServiceImplTest

# Run one specific test method
mvn test -Dtest=SessionServiceImplTest#createSession_withFibonacci_savesSessionAndReturnsModerator
```

Test reports are written to `backend/target/surefire-reports/` after each run.

---

## Test coverage guide

| What to test | How |
|---|---|
| Happy path (valid input → success) | Stub dependencies, assert return value |
| Validation guards (bad input → exception) | `assertThatThrownBy` + `hasMessageContaining` |
| Repository method was called | `verify(repository).save(...)` |
| Side effects (events published) | `verify(webSocketEventPublisher).storyFinalized(...)` |
| Business rules (observer can't vote, etc.) | Set the forbidden state, assert exception |
| Service → repository method mapping | Stub the specific query method, verify it's called |

Services with only happy-path tests give a false sense of security — always test the guard clauses too.
