# 05 — Routing with React Router

## Why client-side routing?

In a traditional multi-page website, clicking a link sends a request to the server, which returns a brand-new HTML page. The whole page reloads and the browser starts fresh.

In a **Single Page Application (SPA)** like EstiMate:
- The browser loads one HTML file (`index.html`) once.
- JavaScript **intercepts** link clicks and URL changes.
- Only the component tree changes — the network request does NOT go to the server.
- This feels instant and keeps application state alive between navigations.

React Router v7 is the library that makes this work.

## Core concepts

### `BrowserRouter`

Wraps the whole app. It watches the browser URL and makes routing possible. Uses the HTML5 History API under the hood.

```jsx
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(...).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```
*(EstiMate puts this in `App.jsx` wrapped inside `SessionProvider`.)*

### `Routes` and `Route`

Define which component renders for which URL:

```jsx
import { Routes, Route } from 'react-router-dom'

<Routes>
  <Route path="/"            element={<Home />} />
  <Route path="/session/:code" element={<SessionPage />} />
  <Route path="*"            element={<NotFound />} />
</Routes>
```

- `path="/"` — exact match for the root URL
- `path="/session/:code"` — `:code` is a **URL parameter** (dynamic segment)
- `path="*"` — wildcard, catches anything not matched above (404 handler)

### URL parameters

```jsx
// Route: /session/:code
// URL visited: /session/ABC123

import { useParams } from 'react-router-dom'

function SessionPage() {
  const { code } = useParams()
  // code === 'ABC123'
}
```

### `useNavigate` — programmatic navigation

Instead of `<a href="...">`, use `useNavigate` to redirect programmatically (e.g., after an API call succeeds):

```jsx
import { useNavigate } from 'react-router-dom'

function CreateSession() {
  const navigate = useNavigate()

  async function handleCreate(formData) {
    const response = await sessionAPI.create(formData)
    const code = response.data.sessionCode
    navigate(`/session/${code}`)  // redirect to the new session
  }
}
```

With the second argument you can replace the history entry instead of pushing:
```jsx
navigate('/', { replace: true })  // no "back" button to previous route
```

### `<Navigate />` — redirect in JSX

When you need to redirect as part of rendering (e.g., a guard):

```jsx
import { Navigate } from 'react-router-dom'

if (!state.session) {
  return <Navigate to="/" replace />
}
```

## EstiMate's route structure

```
/              Home page
               ├── CreateSession component
               └── JoinSession component

/session/*     Planning Poker Session
               (protected — must have active session in context)
```

## Protected routes — `ProtectedSession`

> **The pattern:** Wrap a route's element in a component that checks a condition and either renders the child or redirects.

In `App.jsx`:

```jsx
function ProtectedSession() {
  const { state } = useSession()

  if (!state.session) {
    // No active session → send back to home
    return <Navigate to="/" replace />
  }

  // Has session → wrap the content in the WebSocket provider and render
  return (
    <WebSocketProvider>
      <PlanningPokerSession />
    </WebSocketProvider>
  )
}
```

This prevents someone from navigating directly to `/session` without going through Create/Join first.

Why does this work? Because `SessionContext` persists to `localStorage`, even a page refresh keeps `state.session` populated — the user stays on the session page.

## `<Link>` — in-app navigation without reload

```jsx
import { Link } from 'react-router-dom'

<Link to="/">Go home</Link>
```

`<Link>` renders an `<a>` tag but intercepts the click so the page doesn't reload.

## Nested routes

React Router supports nesting — child `<Route>` elements render inside their parent's `<Outlet>`:

```jsx
<Route path="/session" element={<SessionLayout />}>
  <Route path="stories"   element={<StoryList />} />
  <Route path="analytics" element={<AnalyticsDashboard />} />
</Route>

// SessionLayout:
function SessionLayout() {
  return (
    <div>
      <SessionHeader />
      <Outlet />  {/* child route renders here */}
    </div>
  )
}
```

EstiMate uses the `/session/*` wildcard (the `*`) to allow the session to manage its own internal tab-based navigation via component state rather than URL routes — a common pattern for tabbed UIs.

## Passing state through navigation

Sometimes you want to pass data to the next route without using URL params (they are public and limited in size). React Router supports this via the `state` option:

```jsx
navigate('/session', { state: { sessionCode: 'ABC123' } })
```

Reading on the other side:
```jsx
import { useLocation } from 'react-router-dom'
const location = useLocation()
const { sessionCode } = location.state || {}
```

EstiMate uses the Context + `localStorage` approach instead, but this is a useful pattern to know.

## How routing fits in `App.jsx`

```jsx
// frontend/src/App.jsx (simplified)
export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/session/*" element={<ProtectedSession />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SessionProvider>
  )
}
```

`SessionProvider` wraps `BrowserRouter` so any component inside — including route guards — can access the session state.

## Key takeaways

- React Router intercepts URL changes so the page never reloads — it's all client-side.
- `<Routes>` + `<Route>` map URL paths to components.
- `useNavigate()` navigates programmatically (after API calls, form submissions, etc.).
- `<Navigate>` redirects inside JSX rendering (used for route guards).
- **Protected routes** check a condition in context and redirect if not met.
- URL state that must survive page refresh goes in `localStorage` (via Context), not just the URL.

---
**Next:** [06 — API Communication with Axios](06-api-communication.md)
