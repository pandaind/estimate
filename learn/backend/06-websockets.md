# 06 — Spring WebSocket and Real-Time Events

## Why WebSocket in the backend?

When the moderator reveals votes, all participants must see the results **simultaneously** — without anyone refreshing the page. HTTP (request-response) can't do this; the server can't push to clients that didn't ask.

**WebSocket** opens a persistent, bidirectional connection. The backend can push messages to connected clients at any time.

## The STOMP protocol

Raw WebSocket sends unstructured byte frames. **STOMP** (Simple Text Oriented Messaging Protocol) adds pub/sub messaging conventions:

- **Destinations**: topic paths like `/topic/session/ABC123/reveal`
- **Subscribe**: a client subscribes to a destination and receives all messages sent to it
- **Send**: a client (or server) sends a message to a destination
- **Broadcast**: a message sent to `/topic/...` is delivered to all subscribers

Spring's `@EnableWebSocketMessageBroker` sets up a STOMP message broker with this semantic.

## Configuration — `WebSocketConfig.java`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // These prefixes are for topics clients subscribe TO
        // The simple broker keeps subscribers in-memory
        registry.enableSimpleBroker("/topic");

        // This prefix is for messages clients SEND to the server (app endpoints)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The WebSocket endpoint clients connect to
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")   // CORS for WebSocket
            .withSockJS();                   // SockJS fallback (long-polling if WS blocked)
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register the JWT authentication interceptor
        registration.interceptors(webSocketAuthInterceptor);
    }
}
```

### What each prefix does

```
Client SUBSCRIBES to: /topic/session/ABC123/reveal
  → simple in-memory broker handles delivery

Client SENDS to:      /app/session/ABC123/chat  (if you had a chat feature)
  → Spring routes to a @MessageMapping handler method
```

In EstiMate, the frontend only **subscribes** to topics — it never sends STOMP messages. All writes go through the REST API instead. This is a deliberate design choice: REST gives you HTTP validation, auth, and response codes; WebSocket just broadcasts events.

## `WebSocketEventPublisher` — the central event bus

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    // Topic path constants — defined once, not scattered in code
    private static final String SESSION_STORY_TOPIC  = "/topic/session/%s/story";
    private static final String SESSION_REVEAL_TOPIC = "/topic/session/%s/reveal";
    private static final String SESSION_USERS_TOPIC  = "/topic/session/%s/users";
    private static final String SESSION_VOTES_TOPIC  = "/topic/session/%s/votes";
    private static final String SESSION_TIMER_TOPIC  = "/topic/session/%s/timer";

    // Called when the moderator activates a story
    public void publishStoryActivated(String sessionCode, StoryDTO story) {
        String topic = String.format(SESSION_STORY_TOPIC, sessionCode);
        messagingTemplate.convertAndSend(topic, new StoryEvent("STORY_ACTIVATED", story));
        log.debug("Published STORY_ACTIVATED to {}", topic);
    }

    // Called when a vote is cast
    public void publishVoteCast(String sessionCode, int voteCount, int totalParticipants) {
        String topic = String.format(SESSION_VOTES_TOPIC, sessionCode);
        messagingTemplate.convertAndSend(topic, Map.of(
            "voteCount", voteCount,
            "totalParticipants", totalParticipants
        ));
    }

    // Called after votes are revealed
    public void publishVotesRevealed(String sessionCode, List<VoteDTO> votes) {
        String topic = String.format(SESSION_REVEAL_TOPIC, sessionCode);
        messagingTemplate.convertAndSend(topic, new RevealEvent("VOTES_REVEALED", votes));
    }

    // Called when a user joins
    public void publishUserJoined(String sessionCode, UserDTO user) {
        String topic = String.format(SESSION_USERS_TOPIC, sessionCode);
        messagingTemplate.convertAndSend(topic, new UserEvent("USER_JOINED", user));
    }
}
```

`SimpMessagingTemplate` is Spring's class for sending messages programmatically to STOMP topics. It serialises the Java object to JSON automatically.

## How services use the publisher

```java
// SessionServiceImpl.java
@Override
@Transactional
public void revealVotes(String sessionCode) {
    Session session = findSession(sessionCode);

    // 1. Update the database
    session.setVotesRevealed(true);
    sessionRepository.save(session);

    // 2. Load all votes for the current story
    List<Vote> votes = voteRepository.findByStoryId(session.getCurrentStory().getId());
    List<VoteDTO> voteDTOs = votes.stream().map(this::toVoteDTO).collect(Collectors.toList());

    // 3. Broadcast to everyone watching this session
    wsPublisher.publishVotesRevealed(sessionCode, voteDTOs);
}
```

The pattern: **persist first, then publish**. This ensures:
- If the DB write fails, the event is not sent (no inconsistency).
- If the event send fails, the data is still committed (clients can refresh and get the current state via REST).

## Event objects

Events are simple value objects. Jackson serialises them to JSON:

```java
public class StoryEvent {
    private String type;    // "STORY_ACTIVATED", "STORY_RESET", "STORY_FINALIZED"
    private StoryDTO story;
}

public class RevealEvent {
    private String type;    // "VOTES_REVEALED", "VOTES_RESET"
    private List<VoteDTO> votes;
}

public class UserEvent {
    private String type;    // "USER_JOINED", "USER_LEFT"
    private UserDTO user;
}
```

The `type` field lets the frontend `switch` on the event type to know what to do.

## Topic design — per-session isolation

All topics are namespaced with the session code:

```
/topic/session/ABC123/story   ← only for session ABC123
/topic/session/ABC123/reveal
/topic/session/XYZ789/story   ← completely separate
```

A user in session `ABC123` subscribes only to `ABC123` topics. They never receive events from `XYZ789`. This is the simplest form of access isolation without complex filtering logic.

## Full event flow — moderator activates a story

```
Moderator clicks "Activate Story"
  → PUT /api/sessions/ABC123/stories/7/activate  (HTTP REST)
    → JwtAuthFilter validates JWT
    → StoryController.activateStory(code="ABC123", storyId=7)
      → StoryServiceImpl.activateStory()
        → story.setStatus(IN_PROGRESS)
        → session.setCurrentStory(story)
        → storyRepository.save(story)
        → sessionRepository.save(session)  ← DB transaction commits
        → wsPublisher.publishStoryActivated("ABC123", toDTO(story))
          → SimpMessagingTemplate sends to /topic/session/ABC123/story
            → All 5 subscribers receive the message immediately
              → useSessionWebSocket.onStoryUpdate({ type: "STORY_ACTIVATED", story: {...} })
                → React state update → CurrentStoryBanner renders the story title
      → returns 200 OK to the moderator's browser
```

REST handles the write; WebSocket handles the broadcast. Every participant sees the update within milliseconds.

## `@MessageMapping` — receiving messages from clients (optional)

If you *want* clients to send messages via WebSocket (not REST), use `@MessageMapping`:

```java
@Controller
public class ChatController {

    @MessageMapping("/session/{code}/chat")  // clients send to /app/session/{code}/chat
    @SendTo("/topic/session/{code}/chat")    // broadcast to all subscribers
    public ChatMessage handleMessage(@DestinationVariable String code,
                                     ChatMessage message) {
        return message;  // echoed to all subscribers
    }
}
```

EstiMate doesn't use this pattern (all writes are REST), but it's good to know it exists.

## Heartbeat and reconnection

The STOMP client configuration in `WebSocketConfig`:
```java
// Not currently set in WebSocketConfig — defaults used
// Frontend sets:
heartbeatIncoming: 4000   // client expects a heartbeat from server every 4s
heartbeatOutgoing: 4000   // client sends a heartbeat to server every 4s
```

If a heartbeat is missed, the client detects a stale connection and reconnects (with exponential backoff configured in `WebSocketProvider`).

## The simple broker vs. a full message broker

Spring's `enableSimpleBroker("/topic")` uses an **in-memory** broker. This works well for a single server instance.

For production with multiple server instances, you'd replace this with a full external broker (RabbitMQ, ActiveMQ) using `enableStompBrokerRelay`. EstiMate uses the simple broker — sufficient for a single-process deployment.

## Key takeaways

- `@EnableWebSocketMessageBroker` + `WebSocketConfig` set up the STOMP broker.
- `/topic` prefix = subscription destinations; `/app` prefix = client-send destinations.
- `SockJS` provides fallback transport (long-polling) when WebSocket is blocked.
- `WebSocketEventPublisher` is the single component responsible for all event publishing — topic paths are not scattered.
- Pattern: persist to DB first, then publish the WebSocket event.
- Topics are namespaced by session code — users only receive events for their session.
- `WebSocketAuthInterceptor` validates JWT at STOMP CONNECT time (not per-message — too expensive).

---
**Next:** [07 — Global Exception Handling](07-exception-handling.md)
