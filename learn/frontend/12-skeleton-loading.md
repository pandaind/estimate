# 12 — Skeleton Loading & Mobile Responsiveness

## Why skeleton screens?

Spinners tell users "something is loading" but give no hint about what's coming. **Skeleton screens** show the shape of the content that will appear, reducing perceived load time and preventing layout shift.

| Approach | User experience |
|---|---|
| Spinner | "Something is loading…" (unknown shape) |
| Blank space | "Is it broken?" |
| **Skeleton** | "I can see where the content will be" (predictable) |

---

## Building a reusable Skeleton component

### Base block

A single animated placeholder element:

```jsx
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}
```

The `animate-pulse` class from Tailwind creates a gentle fade-in/fade-out animation. The `className` prop lets each usage control size:

```jsx
<Skeleton className="h-4 w-3/4" />    {/* Text line */}
<Skeleton className="h-10 w-full" />   {/* Input field */}
<Skeleton className="h-32 w-full" />   {/* Card body */}
```

### Composed skeletons

Build larger loading states from the base:

```jsx
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
```

### Page-level skeletons

For the session page, a skeleton mimics the full layout:

```jsx
export function SessionSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Story cards */}
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Sidebar */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
```

### Using skeletons in place of spinners

Replace a loading spinner:

```jsx
// ❌ Before — generic spinner
if (loading) return <div className="animate-spin">⟳</div>;

// ✅ After — content-shaped skeleton
if (loading) return <AnalyticsSkeleton />;
```

EstiMate's `AnalyticsDashboard` replaced its spinner with an `AnalyticsSkeleton` that shows the shape of the charts and stats cards.

---

## Connection status indicator

When the WebSocket disconnects, users need to know the app isn't receiving real-time updates.

### ConnectionStatus component

```jsx
import { useWebSocket } from '../../contexts/WebSocketContext';

export default function ConnectionStatus() {
  const { connected } = useWebSocket();

  if (connected) return null;  // Don't show anything when connected

  return (
    <div
      role="alert"
      className="bg-yellow-500 text-white text-center py-2 px-4 text-sm
                 font-medium animate-pulse"
    >
      Connection lost. Attempting to reconnect...
    </div>
  );
}
```

Key design decisions:
- **Only visible when disconnected** — no banner cluttering the UI during normal use
- **`role="alert"`** — screen readers announce it immediately (see [11-accessibility.md](11-accessibility.md))
- **`animate-pulse`** — draws visual attention to the status
- **Yellow/warning color** — communicates "degraded" without alarm

### Placement

Rendered at the top of the session view, after notifications:

```jsx
function PlanningPokerSession() {
  return (
    <div>
      <RealTimeNotifications />
      <ConnectionStatus />       {/* ← Shows only when disconnected */}
      <SessionHeader />
      {/* ... rest of session */}
    </div>
  );
}
```

---

## Mobile responsiveness with Tailwind

Tailwind uses a **mobile-first** approach: unprefixed classes apply to all screens, prefixed classes (`sm:`, `md:`, `lg:`) apply at that breakpoint and above.

```
Default (all)  →  sm: (640px+)  →  md: (768px+)  →  lg: (1024px+)
```

### Pattern: Responsive grid columns

On mobile, 3 columns can be too tight. Use fewer columns on small screens:

```jsx
{/* ❌ Always 3 columns — cramped on mobile */}
<div className="grid grid-cols-3 gap-2">

{/* ✅ 2 columns on mobile, 3 on sm+ */}
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
```

**Example** — `TimerSettings.jsx` preset duration buttons:

```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
  {presets.map(({ label, value }) => (
    <button key={value} onClick={() => setDuration(value)}>
      {label}
    </button>
  ))}
</div>
```

### Pattern: Responsive text size

Large text can overflow on narrow screens:

```jsx
{/* ❌ Fixed large text */}
<span className="text-6xl font-bold">05:00</span>

{/* ✅ Smaller on mobile, larger on sm+ */}
<span className="text-5xl sm:text-6xl font-bold">05:00</span>
```

### Pattern: Responsive padding and spacing

Generous padding wastes precious mobile space:

```jsx
{/* ❌ Too much padding on mobile */}
<div className="py-16">

{/* ✅ Tight on mobile, spacious on desktop */}
<div className="py-8 sm:py-16">
```

```jsx
{/* Responsive button padding */}
<button className="px-4 sm:px-6 py-2 sm:py-3 text-lg sm:text-xl">
  Start Timer
</button>
```

### Pattern: Flex wrap for overflowing rows

When a row has too many items (title + badges + actions), allow wrapping:

```jsx
{/* ❌ Can overflow on mobile */}
<div className="flex items-center gap-2">
  <span className="font-medium">{title}</span>
  <Badge>In Progress</Badge>
  <Badge>High Priority</Badge>
</div>

{/* ✅ Wraps when needed */}
<div className="flex items-center gap-2 flex-wrap">
  <span className="font-medium">{title}</span>
  <Badge>In Progress</Badge>
  <Badge>High Priority</Badge>
</div>
```

### Pattern: Preventing overflow with min-width

Flex children with text content can refuse to shrink below their content width. Force them to respect the container:

```jsx
{/* ❌ Select can push other elements off-screen */}
<select className="flex-1">

{/* ✅ Allows shrinking below content width */}
<select className="min-w-0 flex-1">
```

`min-w-0` overrides the default `min-width: auto` on flex children, allowing text truncation.

---

## Testing responsive layouts

### Browser DevTools

1. Open **Chrome DevTools** → click the device toolbar icon (or Ctrl+Shift+M)
2. Select a device preset (iPhone SE, Pixel 5) or set custom dimensions
3. Test at these key widths: **320px** (smallest phone), **375px** (iPhone), **768px** (tablet), **1024px** (desktop)

### What to check

- No horizontal scrollbar at any width
- Text doesn't overflow its container
- Buttons are large enough to tap (minimum 44×44px touch target)
- Grids collapse to fewer columns on narrow screens
- Modals are usable (not wider than viewport)
- Important content isn't hidden off-screen

---

## Summary of EstiMate changes

| File | Change | Why |
|---|---|---|
| `Skeleton.jsx` | New component with `Skeleton`, `SkeletonCard`, `SessionSkeleton`, `AnalyticsSkeleton` | Replace spinners with content-shaped loading states |
| `ConnectionStatus.jsx` | New component showing disconnect banner | Users need to know when real-time updates stop |
| `AnalyticsDashboard.jsx` | Replaced spinner with `AnalyticsSkeleton` | Better loading experience |
| `PlanningPokerSession.jsx` | Added `ConnectionStatus` component | Show disconnect state |
| `TimerSettings.jsx` | `grid-cols-2 sm:grid-cols-3` | Preset buttons fit on mobile |
| `VotingTimer.jsx` | Responsive text/padding sizes | Timer display fits narrow screens |
| `ParticipantView.jsx` | Responsive padding/emoji size | Empty state fits mobile |
| `StoryList.jsx` | `flex-wrap` + `min-w-0` | Story rows don't overflow on mobile |
