# 02 — Components and JSX

## What is a component?

A **component** is just a JavaScript function that returns UI. It describes *what* to render, not *how* to imperatively modify the DOM.

```jsx
function Greeting() {
  return <h1>Hello, world!</h1>
}
```

That `<h1>` inside JS is not real HTML — it is **JSX** (JavaScript XML).

## JSX explained

JSX is syntactic sugar that Vite (via Babel under the hood) compiles down to:

```js
// JSX:
return <h1 className="title">Hello</h1>

// compiles to:
return React.createElement('h1', { className: 'title' }, 'Hello')
```

Rules to remember:
- Use `className` instead of `class` (because `class` is a reserved JS keyword).
- All tags must be closed: `<br />`, `<img />`, `<Component />`.
- A component must return **one root element** (or a Fragment `<>…</>`).
- JavaScript expressions go inside `{ }`: `<p>{user.name}</p>`.

## Props — passing data into components

Props are like function arguments. A parent passes them, a child reads them.

```jsx
// Parent
<UserBadge name="Alice" isOnline={true} />

// Child component
function UserBadge({ name, isOnline }) {
  return (
    <span>
      {name} {isOnline ? '🟢' : '⚫'}
    </span>
  )
}
```

Notice `isOnline={true}` — booleans and dynamic values use `{}`.

## A real component from the project: `EstimationCards`

```
frontend/src/components/EstimationCards.jsx
```

Simplified version of what it does:

```jsx
function EstimationCards({ cards, selectedCard, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {cards.map((card) => (
        <button
          key={card}
          onClick={() => onSelect(card)}
          className={selectedCard === card ? 'ring-2 ring-blue-500' : ''}
        >
          {card}
        </button>
      ))}
    </div>
  )
}
```

What to notice:
- **`cards.map()`** renders a list — each item needs a unique `key` prop.
- **`onClick={() => onSelect(card)}`** — event handler calls the parent-provided function.
- **Conditional class** — `selectedCard === card ? '...' : ''` changes style based on state.

## The `children` prop

One special prop is `children` — whatever you put *between* opening and closing component tags.

```jsx
function Card({ children }) {
  return <div className="border rounded p-4">{children}</div>
}

// Used like:
<Card>
  <h2>Planning Poker</h2>
  <p>Select a story to estimate.</p>
</Card>
```

This pattern is used heavily in layout components in the project (e.g., `SessionTabs` renders tab panels as children).

## Component hierarchy in EstiMate

```
App
 └── SessionProvider (context)
      └── BrowserRouter (routing)
           ├── Home (CreateSession + JoinSession)
           └── ProtectedSession
                └── WebSocketProvider
                     └── PlanningPokerSession
                          ├── SessionHeader
                          ├── SessionTabs
                          │    ├── ModeratorView / ParticipantView
                          │    ├── StoryList
                          │    └── AnalyticsDashboard
                          └── RealTimeNotifications
```

Each box is a separate `.jsx` file. Data flows **down** via props, events flow **up** via callback props.

## One-way data flow

React enforces that data flows from parent → child. A child component **never** directly modifies parent state. Instead, the parent passes a callback:

```jsx
// Parent owns the state
const [vote, setVote] = useState(null)

// Passes the setter down as a prop
<VotingPanel onVote={setVote} />

// Child calls the callback when user clicks
function VotingPanel({ onVote }) {
  return <button onClick={() => onVote('5')}>5</button>
}
```

## Conditional rendering

```jsx
// Option 1: ternary
{isModerator ? <ModeratorView /> : <ParticipantView />}

// Option 2: short-circuit (render only if condition is true)
{votesRevealed && <VotingResults />}

// Option 3: early return from the component
if (!session) return <Navigate to="/" />
```

All three patterns appear in the project codebase.

## Lists and keys

When rendering an array, React needs a `key` to track which items changed:

```jsx
{stories.map((story) => (
  <StoryCard key={story.id} story={story} />
))}
```

Always use a **stable unique id** (like `story.id`) as the key — never use the array index if items can be reordered (it causes rendering bugs).

## Component file conventions

```
PascalCase.jsx          ← component files use PascalCase
camelCase.js            ← utility/hook files use camelCase
```

A component file typically exports a single default function:
```jsx
// frontend/src/components/JoinSession.jsx
export default function JoinSession() {
  // ...
}
```

And imports from other files:
```jsx
import JoinSession from './components/JoinSession'
```

## Key takeaways

- A component is a JS function that returns JSX.
- JSX compiles to `React.createElement()` calls.
- Props flow from parent → child; events flow up via callbacks.
- Lists need a `key` prop on each item.
- `children` is the special prop for nested content.

---
**Next:** [03 — State and Hooks](03-state-and-hooks.md)
