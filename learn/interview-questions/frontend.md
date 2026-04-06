# Frontend Interview Questions

Covers every technology used in the EstiMate frontend.  
Difficulty: 🟢 Foundational · 🟡 Intermediate · 🔴 Advanced

---

## React

### 🟢 What is the Virtual DOM and why does React use it?

**Key points:**
- React keeps an in-memory copy of the DOM tree (the Virtual DOM).
- When state changes, React re-renders to a *new* Virtual DOM tree and diffs it against the previous one (reconciliation).
- Only the minimal set of real DOM changes is applied — preventing full-page repaints.
- This makes updates fast because DOM manipulation is expensive; plain JavaScript object diffing is cheap.

---

### 🟢 What is the difference between `props` and `state`?

**Key points:**
- **Props** are inputs passed from a parent to a child component; they are read-only inside the child.
- **State** is data owned and managed *by* a component; changing it triggers a re-render.
- A component can pass its own state *down* as props to a child.

---

### 🟢 When does a React component re-render?

**Key points:**
- Its own state changes (`useState` setter called with a new value).
- A prop it receives changes.
- Its parent re-renders (unless wrapped in `React.memo`).
- A context it consumes changes.

---

### 🟡 Explain `useEffect` — when does it run, and what is the dependency array for?

**Key points:**
- Runs *after* every render by default.
- The dependency array controls when it re-runs: `[]` = mount/unmount only; `[value]` = whenever `value` changes.
- Returns a cleanup function that runs before the next effect execution or on unmount — used to cancel timers, unsubscribe from events, or close WebSocket connections.
- Avoid putting objects/arrays created inline in the dependency array — they are new references each render and cause infinite loops.

**EstiMate example:** `useSessionWebSocket.js` uses `useEffect` to open a STOMP connection on mount and close it on unmount.

---

### 🟡 What problem does `useReducer` solve that `useState` does not?

**Key points:**
- `useReducer` is better when the next state depends on the previous state in complex ways, or when multiple sub-values change together.
- The reducer is a pure function `(state, action) => newState`, making logic testable outside of React.
- `useState` is essentially `useReducer` with a built-in reducer `(_, newValue) => newValue`.

**EstiMate example:** `SessionContext.jsx` uses `useReducer` with actions like `SET_SESSION`, `ADD_STORY`, `UPDATE_VOTE` to manage the entire shared session state.

---

### 🟡 What is React Context? When should you use it and when should you avoid it?

**Key points:**
- Context provides a way to pass data through the component tree without prop-drilling.
- Good for: current user, theme, locale, global UI state that many components read.
- Avoid for: frequently changing values (every subscriber re-renders on every change), or data that only a few components need (just pass props).
- In EstiMate, `SessionContext` wraps the entire app — acceptable because session-level changes (new vote, new story) are infrequent relative to the render budget.

---

### 🟡 What is `React.memo` and when would you use it?

**Key points:**
- `React.memo` is a higher-order component that shallowly compares props; it skips re-rendering if props haven't changed.
- Use it for pure presentational components that receive the same props often while their parent re-renders for unrelated reasons.
- Don't over-use it — the comparison itself has a cost and is only worthwhile if the render is expensive.

---

### 🔴 Explain React's reconciliation algorithm and the role of the `key` prop.

**Key points:**
- React compares the new Virtual DOM tree against the old one element by element.
- For lists, React uses the `key` prop to match old elements to new ones — it assumes elements with the same key are the same element (possibly moved).
- Without `key` (or with index as key), React may reuse the wrong DOM node: input values, focus, and animation state can be corrupted.
- Always use a stable, unique identifier (database ID, UUID) as the `key` for list items, not the array index.

---

### 🔴 How does React 19's concurrent rendering differ from the previous synchronous model?

**Key points:**
- Previously, a single `setState` caused a synchronous render that couldn't be interrupted.
- Concurrent React can pause, discard, or prioritise renders — urgent updates (typing, clicking) are never blocked by slow background renders.
- APIs like `useTransition` and `useDeferredValue` let you mark updates as non-urgent.
- `React.StrictMode` (used in EstiMate's `main.jsx`) intentionally double-invokes render functions in development to surface side-effect bugs that concurrent rendering can expose.

---

## Vite

### 🟢 What is Vite and how does it differ from Webpack/Create React App?

**Key points:**
- Vite uses **native ES modules** in the browser during development — no bundling step; the browser requests files directly.
- On save, only the changed module is reprocessed (HMR — Hot Module Replacement), not the whole project.
- Webpack and CRA bundle everything before serving, which slows down cold starts and HMR as the project grows.
- For production, Vite uses Rollup to create optimised bundles.

---

### 🟡 How do environment variables work in Vite?

**Key points:**
- Only variables prefixed with `VITE_` are exposed to client-side code.
- Accessed as `import.meta.env.VITE_API_URL` (not `process.env`).
- `.env`, `.env.development`, `.env.production` files are loaded automatically.
- Non-prefixed variables (e.g., `DATABASE_URL`) are kept server-side and are never bundled.

---

## React Router

### 🟢 What is client-side routing and how does React Router implement it?

**Key points:**
- The browser never makes a full page load when navigating — React Router intercepts link clicks, updates the URL via the History API, and renders the matching component.
- `<BrowserRouter>` provides the history context; `<Routes>` + `<Route>` declare path-to-component mappings.
- `useNavigate()` returns a function to programmatically navigate; `useParams()` reads dynamic path segments.

---

### 🟡 How would you implement a protected route that redirects unauthenticated users?

**Key points:**
- Wrap the protected `<Route>` in a component that checks auth state and renders either the children or a `<Navigate to="/login" />`.
- In EstiMate, `ProtectedSession` checks for a valid JWT in local storage; if missing, it navigates back to home.

```jsx
function ProtectedSession() {
  const token = tokenManager.get();
  return token ? <SessionLayout /> : <Navigate to="/" replace />;
}
```

---

## Axios and REST

### 🟢 What is the difference between `axios.get` and `fetch`?

**Key points:**
- Axios automatically parses JSON responses; `fetch` requires `.json()`.
- Axios throws for any non-2xx HTTP status; `fetch` only throws on network errors.
- Axios supports request/response **interceptors** — useful for attaching auth headers globally or handling 401 responses.
- Axios has built-in request cancellation via `AbortController`.

---

### 🟡 How do Axios interceptors work? Give an example.

**Key points:**
- Interceptors are middleware that runs before every request is sent or after every response is received.
- A request interceptor attaches the JWT to every request automatically — no need to add the header in each API call.
- A response interceptor can catch 401 responses globally, clear the stored token, and redirect to login.

**EstiMate pattern** (`api.js`):
```js
axiosInstance.interceptors.request.use(config => {
  const token = tokenManager.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      tokenManager.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

---

### 🟡 What is CORS and why does it matter for a React + Spring Boot app?

**Key points:**
- CORS (Cross-Origin Resource Sharing) is a browser security policy that blocks requests from one origin (e.g., `http://localhost:5173`) to a different origin (e.g., `http://localhost:8080`) unless the server explicitly allows it.
- The browser sends a pre-flight `OPTIONS` request; the server must respond with `Access-Control-Allow-Origin` headers.
- In EstiMate, `WebConfig.java` in the backend adds a `CorsConfigurationSource` bean that whitelists the frontend origin.

---

## WebSocket and STOMP

### 🟢 What is the difference between HTTP and WebSocket?

**Key points:**
- HTTP is request-response: the client asks, the server answers, and the connection closes.
- WebSocket is a persistent, full-duplex (bidirectional) connection — either side can send a message at any time.
- WebSocket starts as an HTTP upgrade handshake (`Upgrade: websocket` header), then the protocol switches.
- Use cases for WebSocket: chat, live notifications, collaborative editing, real-time dashboards.

---

### 🟡 What is STOMP and why use it on top of WebSocket?

**Key points:**
- Raw WebSocket sends raw bytes/strings with no messaging semantics (no topics, no routing, no acknowledgement).
- STOMP adds pub/sub semantics: clients **subscribe** to destinations (`/topic/...`) and **send** to destinations (`/app/...`).
- Spring's `@EnableWebSocketMessageBroker` implements a STOMP broker, routing messages by destination.
- SockJS provides fallback transport (HTTP long-polling) when WebSocket is blocked by firewalls or proxies.

---

### 🟡 In EstiMate, why are writes done through REST and not WebSocket?

**Key points:**
- REST gives you HTTP status codes, request validation, and Spring Security's filter chain.
- Each write (vote, story activation) returns a response code the caller can act on (200, 400, 403).
- WebSocket is used only to broadcast state changes *after* a REST write — it's a notification bus, not a command channel.
- This separation keeps the backend simpler and avoids duplicating validation logic.

---

### 🔴 How would you handle WebSocket reconnection and missed events?

**Key points:**
- Detect disconnection via the WebSocket close event or a missed heartbeat.
- Reconnect with **exponential backoff** to avoid thundering-herd when a server restarts.
- On reconnect, do a full REST fetch to get the current state (missed events during downtime are recovered).
- EstiMate's `WebSocketProvider` implements automatic reconnection; after reconnecting it triggers a `refreshSession()` REST call.

---

## Tailwind CSS

### 🟢 What is utility-first CSS? How does it differ from writing custom CSS classes?

**Key points:**
- Utility-first means every class does one thing: `p-4` adds `padding: 1rem`, `text-blue-500` sets a specific colour.
- You compose styles directly in HTML/JSX without writing custom CSS — no naming problem, no specificity wars.
- The trade-off: markup becomes verbose; the benefit: no context-switching between files, no dead CSS.

---

### 🟡 How does Tailwind CSS implement dark mode?

**Key points:**
- With `darkMode: 'class'` in `tailwind.config.js`, Tailwind activates dark variants when the `dark` class is on the `<html>` element.
- Add `dark:` prefix to any utility: `bg-white dark:bg-gray-900`.
- Toggle by adding/removing the `dark` class with JavaScript (stored in `localStorage`).
- EstiMate's `useTheme.js` hook manages this toggle and persists the preference.

---

### 🟡 What is `tailwind-merge` and why is it useful in a component library?

**Key points:**
- When you merge Tailwind classes programmatically (e.g., a component has a default `bg-blue-500` and a caller passes `bg-red-500`), both classes end up in the DOM and the last one wins — unpredictably.
- `tailwind-merge` intelligently removes conflicting classes, keeping only the last value for each CSS property.
- Combined with `clsx` (conditional class composition), this pattern is extracted into a `cn()` helper used throughout EstiMate components.

---

## Framer Motion

### 🟢 What is Framer Motion and how does it differ from CSS transitions?

**Key points:**
- Framer Motion is a React animation library. Animations are declared as props (`initial`, `animate`, `exit`) directly on `motion.*` components.
- CSS transitions are fine for simple hover states, but struggle with enter/exit animations when elements are added/removed from the DOM. Framer Motion handles this via `AnimatePresence`.
- Framer Motion can animate layout changes (`layout` prop), spring physics, and gesture-driven animations.

---

### 🟡 What is `AnimatePresence` and when is it necessary?

**Key points:**
- When a component unmounts in React, it disappears immediately — there is no time for an exit animation.
- `AnimatePresence` wraps components that may be added/removed and defers unmounting until the `exit` animation completes.
- Used in EstiMate for card flip animations when votes are revealed, and for modal transitions.

---

## Testing (Vitest + Testing Library)

### 🟢 What is the difference between unit tests and integration tests in a frontend context?

**Key points:**
- **Unit test**: tests a single function or component in isolation; all dependencies are mocked.
- **Integration test**: renders a component tree and exercises real interactions (clicks, form submissions) — Testing Library encourages this level.
- Testing Library's philosophy: test the way a user interacts with your UI, not implementation details (avoid testing internal state or class names).

---

### 🟡 What does `render` + `screen` from Testing Library do?

**Key points:**
- `render(<Component />)` mounts the component in a virtual DOM (jsdom).
- `screen` provides queries like `getByRole`, `getByText`, `getByLabelText` — they search the rendered DOM.
- Queries that start with `get` throw if not found; `query` returns `null`; `find` returns a Promise (async/await).
- Prefer `getByRole` — it reflects what a screen reader sees and encourages accessible markup.

---

### 🟡 How do you test a custom hook in isolation?

**Key points:**
- Use `renderHook` from `@testing-library/react` to run a hook in a minimal wrapper.
- Wrap in providers (context, router) if the hook depends on them.

```js
const { result } = renderHook(() => useTheme());
expect(result.current.theme).toBe('light');
act(() => result.current.toggleTheme());
expect(result.current.theme).toBe('dark');
```

---

### 🔴 What are the trade-offs of mocking API calls in frontend tests?

**Key points:**
- Mocking (e.g., `vi.mock('../utils/api')`) isolates tests from the network but can drift from real API behaviour.
- **MSW (Mock Service Worker)** intercepts at the network level, giving more realistic integration tests without a running server.
- Over-mocking can create tests that pass while the real app is broken (the mocks reflect your assumptions, not the actual API).
- Balance: unit-test pure logic with mocks; use MSW or real API for critical user flows.

---

## Accessibility

### 🟢 What is an ARIA role and why does it matter?

**Key points:**
- ARIA (Accessible Rich Internet Applications) roles communicate the *purpose* of an element to assistive technologies.
- A `<div>` that looks like a button is invisible to screen readers unless it has `role="button"` + `tabIndex` + keyboard handlers — or better: just use a `<button>`.
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<dialog>`) has implicit ARIA roles; using the right element is always preferable to adding `role=` attributes.

---

### 🟡 What is focus management and why is it important for modals?

**Key points:**
- When a modal opens, focus should move to the first interactive element inside it.
- When the modal closes, focus should return to the element that triggered it.
- Without this, keyboard users lose their position in the page and screen readers don't announce the modal content.
- **Focus trap**: while the modal is open, `Tab` should cycle only through the modal's interactive elements — preventing focus from reaching the (now inert) background content.

---

### 🟡 What does `aria-live` do and when would you use it?

**Key points:**
- `aria-live` marks a region that updates dynamically (status messages, toast notifications, vote counts).
- `aria-live="polite"` announces changes when the user is idle; `aria-live="assertive"` interrupts immediately (use sparingly — only for errors or critical alerts).
- Without `aria-live`, screen readers won't notice DOM changes that happen outside of user focus.

---

---
**Back to overview:** [Interview Questions README](README.md)  
**Related learning:** [Frontend Learning Path](../frontend/README.md)
