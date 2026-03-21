# 07 — Real-Time Collaboration with WebSockets

## Why WebSockets?

With plain REST (HTTP), the client *asks* and the server *answers*. The server can never push data to the client unprompted.

In a planning poker session, you need things like:
- "User Alice just cast a vote" — appear on everyone's screen instantly.
- "Moderator revealed votes" — all participants see results simultaneously.
- "New user joined" — the user list updates live.

**Polling** (sending a GET request every second) would work, but it's wasteful. WebSockets open a **persistent two-way connection** — the server can push messages at any time.

## The protocol stack

```
Browser  ←→  SockJS (transport fallback)
             ├── WebSocket (ideal)
             └── HTTP long-polling (fallback if WebSocket blocked)

SockJS   ←→  STOMP (messaging protocol on top)
             ├── SUBSCRIBE to /topic/...
             └── SEND to /app/...
```

**STOMP** (Simple Text Oriented Messaging Protocol) adds structure to raw WebSocket frames: topics (channels), destinations, headers, and acknowledgements. It is the same concept as pub/sub messaging.

## WebSocket connection endpoint

Backend exposes: `http://localhost:8080/ws`  
Frontend connects to: `VITE_WS_URL` env var (defaults to `http://localhost:8080`)

## The three files

| File | Role |
|------|------|
| `WebSocketProvider.jsx` | Creates and manages the STOMP client, provides `subscribe()` function via Context |
| `useSessionWebSocket.js` | Custom hook — subscribes to the 4 session topics, dispatches to `SessionContext` |
| `RealTimeNotifications.jsx` | Consumes WebSocket events to show toast notifications |

## `WebSocketProvider.jsx` — managing the connection

```
frontend/src/components/websocket/WebSocketProvider.jsx
```

Simplified structure:

```jsx
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WebSocketContext = createContext(null)

export function WebSocketProvider({ children }) {
  const stompClient = useRef(null)             // persists without re-render
  const [connected, setConnected] = useState(false)
  const subscriptions = useRef({})             // active subscriptions
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),

      // JWT in STOMP CONNECT headers — backend validates this
      connectHeaders: {
        Authorization: `Bearer ${tokenManager.get()}`,
      },

      onConnect: () => {
        setConnected(true)
        reconnectAttempts.current = 0
      },

      onDisconnect: () => setConnected(false),

      // Exponential backoff: 3s, 6s, 12s, 24s, 48s — max 5 attempts
      reconnectDelay: Math.min(3000 * 2 ** reconnectAttempts.current, 48000),

      // Heartbeat: client sends a ping every 4s, expects one every 4s
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.activate()             // start the connection
    stompClient.current = client

    return () => client.deactivate()  // cleanup on unmount
  }, [])

  // Subscribe to a topic, return unsubscribe function
  function subscribe(topic, callback) {
    if (!stompClient.current?.connected) return () => {}
    const sub = stompClient.current.subscribe(topic, (frame) => {
      callback(JSON.parse(frame.body))
    })
    return () => sub.unsubscribe()
  }

  return (
    <WebSocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  )
}
```

Key decisions:
- `stompClient` is a **ref** (not state) so changing it doesn't trigger re-renders.
- The STOMP CONNECT frame includes the **JWT** — the backend's `WebSocketAuthInterceptor` validates it. If the token is invalid, the connection is rejected.
- Exponential backoff prevents hammering the server on disconnect.
- The `subscribe` function is the public API — other components call it to listen for messages.

## `useSessionWebSocket.js` — subscribing to session topics

```
frontend/src/hooks/useSessionWebSocket.js
```

This hook runs inside `PlanningPokerSession`. It:
1. Gets `subscribe` from `WebSocketContext`
2. Subscribes to all 4 session-specific topics
3. When messages arrive, updates local React state (stories, users, etc.)

```js
export function useSessionWebSocket(sessionCode, { onStoryUpdate, onUsersUpdate, onReveal }) {
  const { connected, subscribe } = useContext(WebSocketContext)

  useEffect(() => {
    if (!connected) return  // wait until connected

    const unsubscribers = [
      subscribe(`/topic/session/${sessionCode}/story`, (event) => {
        // event.type: STORY_ACTIVATED | STORY_RESET | STORY_FINALIZED
        onStoryUpdate(event)
      }),

      subscribe(`/topic/session/${sessionCode}/users`, (event) => {
        // event.type: USER_JOINED | USER_LEFT
        onUsersUpdate(event)
      }),

      subscribe(`/topic/session/${sessionCode}/reveal`, (event) => {
        // event.type: VOTES_REVEALED | VOTES_RESET
        onReveal(event)
      }),

      subscribe(`/topic/session/${sessionCode}/votes`, (event) => {
        // event: { voteCount: 3, totalUsers: 5 }
        onVoteCountUpdate(event)
      }),
    ]

    // Cleanup: unsubscribe all when component unmounts or disconnects
    return () => unsubscribers.forEach(unsub => unsub())
  }, [connected, sessionCode])  // re-run if reconnected or session changes
}
```

The dependency `[connected, sessionCode]` is important:
- If the WebSocket disconnects and reconnects (`connected` flips false → true), the effect re-runs and re-subscribes.
- If the session changes (unlikely but possible), it re-subscribes to the new session's topics.

## The topic map

```
/topic/session/{code}/story
  → STORY_ACTIVATED   (moderator set active story)
  → STORY_RESET       (votes cleared)
  → STORY_FINALIZED   (estimate accepted)

/topic/session/{code}/reveal
  → VOTES_REVEALED    (cards flipped)
  → VOTES_RESET       (back to voting state)

/topic/session/{code}/users
  → USER_JOINED       (new participant)
  → USER_LEFT         (participant disconnected)

/topic/session/{code}/timer
  → TIMER_SETTINGS_CHANGED

/topic/session/{code}/votes
  → { voteCount, totalParticipants }   (a vote was cast)
```

Notice these are **per-session** topics — the session code is in the URL. Users in different sessions never receive each other's events.

## How the backend sends these messages

On the server side (you'll study this in the backend tutorials), `WebSocketEventPublisher` is:

```java
// backend — WebSocketEventPublisher.java
simpMessagingTemplate.convertAndSend(
  "/topic/session/" + sessionCode + "/story",
  new StoryEvent("STORY_ACTIVATED", story)
)
```

The Spring backend converts the Java object to JSON and sends it to all subscribers on that topic.

## Real-time notifications — `RealTimeNotifications.jsx`

```
frontend/src/components/websocket/RealTimeNotifications.jsx
```

Subscribes to the same topics and shows toast messages:

```jsx
subscribe(`/topic/session/${code}/users`, (event) => {
  if (event.type === 'USER_JOINED') {
    toast(`${event.user.name} joined the session`)
  }
  if (event.type === 'USER_LEFT') {
    toast(`${event.user.name} left the session`)
  }
})
```

## The complete real-time flow

```
Moderator clicks "Reveal Votes"
  → voteAPI.reveal(sessionCode)  [HTTP POST]
    → backend VoteController → SessionService.revealVotes()
      → saves to DB
        → WebSocketEventPublisher sends to /topic/session/ABC123/reveal
          → STOMP broker delivers to all subscribers (all browser tabs)
            → useSessionWebSocket callback fires in every browser
              → setVotesRevealed(true)
                → React re-renders → VotingResults component appears
                  → RealTimeNotifications shows toast: "Votes revealed!"
```

All participants see the results at the same time — sub-second latency.

## Connection status indicator

`UserPresence.jsx` and `VoteProgress.jsx` consume `connected` from `WebSocketContext` to show a live indicator in the UI:

```jsx
const { connected } = useContext(WebSocketContext)
return <span className={connected ? 'text-green-500' : 'text-red-500'}>
  {connected ? 'Live' : 'Reconnecting...'}
</span>
```

## Key takeaways

- WebSockets are persistent two-way connections — the server can push data without the client asking.
- STOMP adds pub/sub semantics on top of WebSocket (topics, subscriptions, messages).
- `WebSocketProvider` manages one shared STOMP client, exposes `subscribe()` via context.
- `useSessionWebSocket` manages subscription lifecycle — it re-subscribes after reconnects.
- Topics are **session-scoped** — users in different sessions are isolated.
- JWT authentication happens at STOMP CONNECT time — the same token used for REST.

---
**Next:** [08 — Styling with Tailwind CSS](08-tailwind-styling.md)
