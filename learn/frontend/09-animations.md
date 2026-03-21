# 09 — Animations with Framer Motion

## Why animate?

Good animations:
- Give feedback — the user sees *what* changed and *where*.
- Make transitions feel smooth instead of jarring.
- Communicate state — a card that "flips" when votes are revealed clearly signals a state change.

Without animations, UIs feel abrupt. React by default adds and removes elements instantly.

## Framer Motion basics

Framer Motion provides a set of HTML/SVG components prefixed with `motion.` that accept animation props.

```jsx
import { motion } from 'framer-motion'

// Instead of:
<div className="card">...</div>

// Use:
<motion.div
  className="card"
  initial={{ opacity: 0, y: 20 }}   // starting state
  animate={{ opacity: 1, y: 0 }}    // target state
  exit={{ opacity: 0, y: -20 }}     // when removed from DOM
>
  ...
</motion.div>
```

Any CSS-animatable property works: `opacity`, `x`, `y`, `scale`, `rotate`, `height`, etc.

## The `initial` / `animate` / `exit` pattern

| Prop | When it applies |
|------|----------------|
| `initial` | The moment the component mounts |
| `animate` | The state to animate *to* (or maintain) |
| `exit` | The state to animate *to* before the component unmounts |

```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}   // starts invisible and slightly small
  animate={{ opacity: 1, scale: 1 }}     // fades in and scales up
  exit={{ opacity: 0, scale: 0.9 }}      // fades out when removed
  transition={{ duration: 0.2 }}         // 200ms
>
  <VotingResults />
</motion.div>
```

## `AnimatePresence` — animating removal

React components disappear instantly when removed from the tree. `AnimatePresence` intercepts the removal and waits for the `exit` animation to complete first.

```jsx
import { AnimatePresence, motion } from 'framer-motion'

function App() {
  const [show, setShow] = useState(true)

  return (
    <>
      <button onClick={() => setShow(s => !s)}>Toggle</button>

      <AnimatePresence>
        {show && (
          <motion.div
            key="box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}       // without AnimatePresence, exit is ignored
          >
            Hello!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

**Important:** Always provide a `key` to elements inside `AnimatePresence`. Framer Motion uses it to track the identity of the element.

## Where it's used in EstiMate

### Page/tab transitions

When switching between tabs (Stories / Voting / Analytics), a cross-fade makes the transition smooth:

```jsx
// SessionTabs.jsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}                            // key changes = triggers exit + enter
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.15 }}
  >
    {renderActiveTab()}
  </motion.div>
</AnimatePresence>
```

`mode="wait"` means the exiting component fully animates out before the entering one starts.

### Modal/overlay entrance

```jsx
// ExportModal.jsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* panel */}
      <motion.div
        key="panel"
        className="fixed inset-y-0 right-0 w-96 bg-white"
        initial={{ x: '100%' }}     // starts off-screen to the right
        animate={{ x: 0 }}          // slides in
        exit={{ x: '100%' }}        // slides back out
        transition={{ type: 'spring', damping: 25 }}
      >
        <ExportOptions />
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### List item animations

When a new story is added to the list:

```jsx
// StoryList.jsx
<AnimatePresence>
  {stories.map((story) => (
    <motion.li
      key={story.id}
      layout                                 // animates reordering
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <StoryCard story={story} />
    </motion.li>
  ))}
</AnimatePresence>
```

The `layout` prop makes Framer Motion animate the position change when items reorder (great with drag-and-drop).

### Vote card reveal animation

```jsx
// VotingResults.jsx — voting card flip on reveal
<motion.div
  initial={{ rotateY: 180, opacity: 0 }}
  animate={{ rotateY: 0, opacity: 1 }}
  transition={{ delay: index * 0.05, duration: 0.4 }}  // staggered reveal
>
  {vote.estimate}
</motion.div>
```

The `delay: index * 0.05` staggers each card — they flip one by one in rapid succession.

## Transition types

```jsx
// Duration-based (default)
transition={{ duration: 0.3 }}

// Spring physics — feels natural, bouncy
transition={{ type: 'spring', stiffness: 300, damping: 20 }}

// Spring with custom duration
transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}

// Easing
transition={{ ease: 'easeOut', duration: 0.2 }}
```

Spring animations are preferred for interactive elements (cards, modals) because they feel physical. Duration-based easing is better for overlays and fades.

## `whileHover` and `whileTap` — gesture animations

```jsx
<motion.button
  whileHover={{ scale: 1.02 }}    // grows slightly on hover
  whileTap={{ scale: 0.98 }}      // shrinks when pressed
  transition={{ duration: 0.1 }}
>
  Submit Vote
</motion.button>
```

This is even simpler than using CSS `hover:scale-105` because Framer Motion handles the spring physics automatically.

## Variants — reusable animation states

For complex or repeated animations, define **variants** (named states):

```jsx
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
}

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
```

Variants also enable **stagger children** — parent triggers, children animate in sequence:

```jsx
const containerVariants = {
  visible: {
    transition: { staggerChildren: 0.05 }  // each child 50ms after previous
  }
}

const itemVariants = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

Each `<motion.li>` inherits the variant names from its parent — you only call `initial`/`animate` on the parent.

## `useAnimation` — programmatic control

Sometimes you need to trigger an animation in response to an event (like "shake on error"):

```jsx
import { useAnimation } from 'framer-motion'

const controls = useAnimation()

async function handleError() {
  await controls.start({ x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } })
}

<motion.div animate={controls}>
  <input ... />
</motion.div>
```

## Performance tip

Framer Motion animates GPU-accelerated properties by preference:
- `x`, `y` → `transform: translateX/Y` ✅ GPU
- `opacity` ✅ GPU
- `width`, `height` → layout recalculation ❌ CPU (avoid animating these unless necessary)

Use `x`/`y` instead of `left`/`top`, and avoid animating `width`/`height` unless you use the `layout` prop (which Framer Motion optimises automatically).

## Key takeaways

- `motion.div` (and other `motion.*` elements) accept `initial`, `animate`, `exit`, and `transition` props.
- `AnimatePresence` enables `exit` animations — always add `key` to children.
- Spring transitions feel natural for interactive elements; duration/easing for fades.
- `whileHover`/`whileTap` add gesture-based micro-interactions.
- Variants enable name-based states and stagger effects across child lists.
- Animate GPU-accelerated properties (`x`, `y`, `opacity`, `scale`) for best performance.

---

**You've completed the frontend learning path!**

Now move on to the [backend tutorials](../backend/README.md) to understand how Spring Boot powers the API that React calls.
