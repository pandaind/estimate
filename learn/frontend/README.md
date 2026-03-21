# Frontend Learning Path

Welcome! This folder walks you through every concept used in the EstiMate frontend — from "what is React" to real-time WebSocket collaboration. Each file builds on the previous one.

## Reading Order

| File | Topic | What you'll understand |
|------|--------|------------------------|
| [01-intro-react-vite.md](01-intro-react-vite.md) | React + Vite | How the app starts and why these tools |
| [02-components-jsx.md](02-components-jsx.md) | Components + JSX | Building-blocks of every UI element |
| [03-state-and-hooks.md](03-state-and-hooks.md) | useState / useEffect | Local state and side-effects |
| [04-context-state-management.md](04-context-state-management.md) | Context + useReducer | Global state that the whole app shares |
| [05-routing.md](05-routing.md) | React Router | How navigation and protected routes work |
| [06-api-communication.md](06-api-communication.md) | Axios + REST | Talking to the backend, JWT tokens |
| [07-websockets.md](07-websockets.md) | WebSocket + STOMP | Real-time collaboration |
| [08-tailwind-styling.md](08-tailwind-styling.md) | Tailwind CSS | Utility-first styling and dark mode |
| [09-animations.md](09-animations.md) | Framer Motion | Smooth transitions and animations |

## Technologies at a glance

```
React 19          ← UI library
Vite 7            ← Build tool & dev server
React Router v7   ← Client-side navigation
Axios             ← HTTP client (REST)
@stomp/stompjs    ← WebSocket (real-time)
Tailwind CSS 3    ← Styling
Framer Motion 12  ← Animations
```

## Where code lives

```
frontend/src/
  main.jsx              ← Entry point — mounts React into index.html
  App.jsx               ← Routes, providers, layout
  components/           ← All UI components
    session/            ← Views for an active planning session
    voting/             ← Estimation card panel
    story/              ← Story editor
    analytics/          ← Charts and metrics
    websocket/          ← Real-time connection components
    ux/                 ← UX helpers (tutorial, drag-and-drop)
  contexts/
    SessionContext.jsx  ← Global state (useReducer + Context)
  hooks/
    useSessionWebSocket.js  ← WebSocket subscription logic
    useTheme.js             ← Dark / light mode
  utils/
    api.js              ← All Axios calls to the backend
    constants.js        ← Shared constants (card values, etc.)
    cn.js               ← className helper (clsx + tailwind-merge)
```
