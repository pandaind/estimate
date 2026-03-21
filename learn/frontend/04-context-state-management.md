# 04 — Context and Global State Management

## The problem with prop drilling

Imagine the `userId` needs to reach `VoteButton`, which is buried 5 levels deep:

```
App → PlanningPokerSession → SessionTabs → ParticipantView → VoteButton
```

You'd have to pass `userId` as a prop through every component in between, even the ones that don't need it. This is called **prop drilling** and it makes code hard to maintain.

**React Context** solves this by making a value available to *any* component in the tree without passing it through every level.

## React Context — the concept

Three pieces:
1. **Create** the context: `createContext()`
2. **Provide** a value: `<SomeContext.Provider value={...}>`
3. **Consume** the value: `useContext(SomeContext)` in any descendant

```jsx
// 1. Create
const ThemeContext = createContext('light')

// 2. Provide (wrap the tree)
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// 3. Consume (anywhere inside the Provider)
function Button() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Click me</button>
}
```

## `useReducer` — state with complex logic

For state with multiple sub-values and complex update logic, `useReducer` is cleaner than several `useState` calls.

```
useState  →  good for: simple on/off, string values, numbers
useReducer →  good for: objects with multiple fields, state machine-like logic
```

```jsx
// Define what state looks like
const initialState = { count: 0, status: 'idle' }

// Define how state changes in response to actions
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Use it
const [state, dispatch] = useReducer(reducer, initialState)
dispatch({ type: 'INCREMENT' })
```

`dispatch` sends an **action** (an object with a `type`) to `reducer`. The reducer returns the *next* state. React re-renders with the new state.

## `SessionContext` — EstiMate's global state

```
frontend/src/contexts/SessionContext.jsx
```

This is the most important piece of global state in the app. Here is how it works:

### The shape of state

```js
const initialState = {
  session: null,      // the active session object (or null)
  userName: null,     // current user's display name
  userId: null,       // current user's id (from backend)
  isModerator: false  // whether this user is moderator
}
```

### The actions (how state changes)

```js
// ACTION:           WHEN:
SESSION_CREATED      user creates a new session
SESSION_JOINED       user joins an existing session
SESSION_LEFT         user leaves (cleanup)
SESSION_UPDATED      settings or story changed
```

### The reducer

```jsx
function sessionReducer(state, action) {
  switch (action.type) {
    case 'SESSION_CREATED':
    case 'SESSION_JOINED':
      return {
        ...state,
        session: action.payload.session,
        userName: action.payload.userName,
        userId: action.payload.userId,
        isModerator: action.payload.isModerator,
      }
    case 'SESSION_LEFT':
      return initialState  // wipe everything
    case 'SESSION_UPDATED':
      return { ...state, session: action.payload }
    default:
      return state
  }
}
```

The spread `...state` is crucial — it copies all existing fields so you only override what changed (immutable update pattern).

### The Provider component

```jsx
export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState, () => {
    // lazy initialiser — rehydrate from localStorage on first load
    const saved = localStorage.getItem('session_state')
    return saved ? JSON.parse(saved) : initialState
  })

  // persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem('session_state', JSON.stringify(state))
  }, [state])

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  )
}
```

Why `localStorage`? If the user refreshes the page, their session is not lost. The lazy initialiser reads the saved state back on mount.

### Consuming the context

Any component that needs session info calls `useContext`:

```jsx
import { useContext } from 'react'
import { SessionContext } from '../contexts/SessionContext'

function SessionHeader() {
  const { state, dispatch } = useContext(SessionContext)

  return <h1>{state.session?.name}</h1>
}
```

The project exports a convenience hook to avoid repeating the import:

```jsx
// In SessionContext.jsx
export function useSession() {
  return useContext(SessionContext)
}

// Usage:
const { state, dispatch } = useSession()
```

### Dispatching an action — joining a session

```jsx
// In JoinSession.jsx, after the API call succeeds:
dispatch({
  type: 'SESSION_JOINED',
  payload: {
    session: responseData.session,
    userName: responseData.user.name,
    userId: responseData.user.id,
    isModerator: false,
  }
})
```

### Why not just `useState`?

`useReducer` is better here because:
1. State contains multiple related fields — they all update together atomically.
2. The logic is in the reducer, not scattered in components.
3. Easy to add new action types later.
4. The `dispatch` function reference is stable — it doesn't change between renders.

## The provider tree in `App.jsx`

```jsx
function App() {
  return (
    <SessionProvider>          {/* provides { state, dispatch } everywhere */}
      <BrowserRouter>
        <Routes>
          <Route path="/session/*" element={
            <ProtectedSession>   {/* reads state.session; redirects if null */}
              <WebSocketProvider> {/* provides WebSocket connection */}
                <PlanningPokerSession />
              </WebSocketProvider>
            </ProtectedSession>
          } />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
```

Providers wrap the tree from outside in. Inner components can consume any of them.

## Visualising context updates

```
User clicks "Join Session"  [JoinSession.jsx]
  → API call to POST /api/sessions/{code}/join
    → success: dispatch({ type: 'SESSION_JOINED', payload: {...} })
      → sessionReducer returns new state
        → SessionContext.Provider re-renders with new value
          → all consumers (SessionHeader, ModeratorView, etc.) re-render
            → UI now shows the active session
```

## Key takeaways

- Context solves prop drilling by making values available tree-wide.
- `useReducer` manages complex multi-field state — a reducer function maps actions to new state.
- `SessionContext` holds the single source of truth: session, userId, isModerator.
- Persisting to `localStorage` with `useEffect` + reading back with a lazy initialiser survives page refreshes.
- Always update state **immutably** — copy with `...state` then override only what changed.

---
**Next:** [05 — Routing with React Router](05-routing.md)
