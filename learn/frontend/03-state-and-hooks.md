# 03 — State and Hooks

## What is state?

**State** is data that can change over time and, when it changes, causes the component to re-render with the new value.

Two kinds of data in React:
| | Props | State |
|--|-------|-------|
| Owned by | Parent | The component itself |
| Mutable? | No (read-only) | Yes |
| Changes trigger? | Re-render if parent re-renders | ✅ Always re-renders |

## `useState` — local reactive data

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)  // initial value = 0

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  )
}
```

`useState` returns a pair: `[currentValue, setterFunction]`. The setter triggers a re-render with the new value.

### Real example — vote selection

In `VotingPanel.jsx`, the currently selected card is local state:

```jsx
const [selectedCard, setSelectedCard] = useState(null)

// When the user clicks a card:
<EstimationCards
  cards={session.cards}
  selectedCard={selectedCard}
  onSelect={(card) => setSelectedCard(card)}
/>
```

When `setSelectedCard('5')` is called, React re-renders `VotingPanel` — the new card highlights.

### State based on previous state

When the new state depends on the previous value, use the functional update form:

```jsx
setCount(prev => prev + 1)  // safe — uses the latest value
```

This matters with rapid updates (like timers).

## `useEffect` — side effects

Some things React cannot express as pure rendering:
- Fetching data from the backend
- Setting up a WebSocket connection
- Starting a timer
- Directly touching the DOM

For these, use `useEffect`:

```jsx
useEffect(() => {
  // code that runs AFTER the component renders
  fetchStories()
}, [sessionCode])  // dependency array — re-run when sessionCode changes
```

The **dependency array** controls when the effect re-runs:

| Dependency array | When effect runs |
|------------------|------------------|
| *omitted* | After every render |
| `[]` | Once, on mount only |
| `[value]` | On mount AND whenever `value` changes |

### Cleanup

If your effect creates a subscription or timer, return a cleanup function:

```jsx
useEffect(() => {
  const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)

  return () => clearInterval(timer)  // cleanup when component unmounts
}, [])
```

Without cleanup, the timer would keep running even after the component is gone — a **memory leak**.

### Real example — loading stories

```jsx
// Simplified from PlanningPokerSession.jsx
useEffect(() => {
  async function load() {
    const response = await storyAPI.getAll(sessionCode)
    setStories(response.data)
  }
  load()
}, [sessionCode])
```

## `useRef` — values that don't cause re-renders

A ref holds a value that persists across renders but changing it does **not** trigger a re-render. Two main uses:

1. **Referencing a DOM element**:
```jsx
const inputRef = useRef()
<input ref={inputRef} />
// later:
inputRef.current.focus()
```

2. **Storing a mutable value** (like an interval ID or STOMP client instance):
```jsx
const stompClient = useRef(null)
stompClient.current = new Client(...)
```

The `WebSocketProvider` stores the STOMP `Client` instance in a ref so it survives re-renders without triggering them.

## Custom hooks — reusable logic

A custom hook is just a function whose name starts with `use` and can call other hooks. It lets you extract reusable stateful logic out of components.

### `useTheme` — dark/light mode

```
frontend/src/hooks/useTheme.js
```

```js
export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}
```

Used in `ThemeToggle.jsx`:
```jsx
const { theme, toggleTheme } = useTheme()
```

The component doesn't care *how* the theme is stored — it just calls `toggleTheme()`.

### Lazy initializer for `useState`

Notice the function passed to `useState` above:
```js
useState(() => localStorage.getItem('theme') || 'light')
```

Passing a **function** (not a value) tells React to only run it on the first render. Good for expensive operations like reading from `localStorage`.

## `useCallback` and `useMemo` — performance

These are optimisation hooks — skip them early on, understand the concept:

- **`useMemo`** — memoises a computed value. Only recalculates when dependencies change.
- **`useCallback`** — memoises a function. Only recreates when dependencies change.

They prevent unnecessary recalculations and child re-renders when references change.

## Rules of hooks

1. **Call hooks at the top level** — never inside `if`, loops, or nested functions.
2. **Only call hooks in React functions** — function components or custom hooks.

These rules exist because React tracks hooks in order. Breaking the order causes bugs.

## State flow in the voting round

To see all these hooks together, trace the voting flow:

```
User clicks card (in EstimationCards)
  → onSelect(card) callback runs
    → setSelectedCard(card)  [useState in VotingPanel]
      → VotingPanel re-renders, card highlights
        → user clicks "Submit Vote" button
          → voteAPI.castVote(...)  [API call in useEffect or handler]
            → WebSocket message broadcasts to all participants
              → other users see vote count update  [WebSocket + state update]
```

## Key takeaways

- `useState` tracks reactive local data — updating it re-renders the component.
- `useEffect` handles side effects like fetch calls and subscriptions — always specify dependencies.
- Always return a cleanup function from `useEffect` if you start a timer or subscription.
- `useRef` holds mutable values that shouldn't trigger re-renders.
- Custom hooks extract reusable logic — any function starting with `use`.

---
**Next:** [04 — Context and Global State](04-context-state-management.md)
