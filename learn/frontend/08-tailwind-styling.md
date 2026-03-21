# 08 — Styling with Tailwind CSS

## What is Tailwind CSS?

Tailwind is a **utility-first CSS framework**. Instead of writing custom CSS classes like `.card` or `.button-primary`, you apply small, single-purpose classes directly in your JSX:

```jsx
// Traditional CSS approach:
<div className="card">...</div>        // + CSS: .card { border-radius: 8px; padding: 16px; ... }

// Tailwind approach:
<div className="rounded-lg p-4 border shadow-sm">...</div>
```

Why utility-first?
- No more inventing class names
- No switching between JSX and CSS files
- No CSS specificity battles
- Styles are co-located with the component they apply to
- Tailwind purges unused styles in production — tiny bundle

## How it works in this project

```
tailwind.config.js    ← tells Tailwind where to scan for class names
postcss.config.js     ← processes CSS at build time
index.css             ← declares Tailwind's layers
```

`index.css`:
```css
@tailwind base;        /* resets and base styles */
@tailwind components;  /* component layer (custom classes if any) */
@tailwind utilities;   /* all utility classes */
```

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],  // scan these files
  darkMode: 'class',    // dark mode activated by .dark on <html>
  theme: { ... }
}
```

The `content` array tells Tailwind which files to scan. Any class name found there will be included in the built CSS — everything else is removed.

## Class naming system

Tailwind classes follow a pattern: `{property}-{value}` or `{breakpoint}:{property}-{value}`

### Spacing (padding, margin)

```
p-4     → padding: 1rem (16px)
px-4    → padding-left + padding-right: 1rem
py-2    → padding-top + padding-bottom: 0.5rem
m-auto  → margin: auto
mt-8    → margin-top: 2rem
gap-3   → gap: 0.75rem (for flex/grid containers)
```

The scale: 1 unit = 4px. So `p-4` = 16px, `p-8` = 32px.

### Sizing

```
w-full      → width: 100%
w-64        → width: 16rem (256px)
h-screen    → height: 100vh
max-w-2xl   → max-width: 42rem
min-h-0     → min-height: 0
```

### Typography

```
text-sm       → font-size: 0.875rem
text-xl       → font-size: 1.25rem
text-2xl      → font-size: 1.5rem
font-bold     → font-weight: 700
font-medium   → font-weight: 500
text-gray-600 → color: #4B5563
text-center   → text-align: center
truncate      → overflow: hidden; text-overflow: ellipsis; white-space: nowrap
```

### Colors

Tailwind has a full color palette. Colors follow the pattern `{property}-{color}-{shade}`:

```
bg-blue-600       → background-color: #2563EB
text-white        → color: white
border-gray-200   → border-color: #E5E7EB
ring-blue-500     → ring color (used with ring-2)
```

Shades go from 50 (lightest) to 950 (darkest). Common shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900.

### Layout

```
flex              → display: flex
flex-col          → flex-direction: column
items-center      → align-items: center
justify-between   → justify-content: space-between
grid              → display: grid
grid-cols-3       → grid-template-columns: repeat(3, 1fr)
hidden            → display: none
block             → display: block
```

### Borders and shapes

```
rounded           → border-radius: 0.25rem
rounded-lg        → border-radius: 0.5rem
rounded-full      → border-radius: 9999px (circle)
border            → border-width: 1px
border-2          → border-width: 2px
shadow            → small shadow
shadow-lg         → larger shadow
ring-2            → outline ring (useful for focus states)
```

## Responsive design

Tailwind uses **mobile-first** breakpoints. Apply a class without prefix for mobile, add a breakpoint prefix for larger screens:

```
sm:   640px+
md:   768px+
lg:   1024px+
xl:   1280px+
2xl:  1536px+
```

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

This renders 1 column on mobile, 2 on tablet, 3 on desktop.

## Dark mode

Remember in `tailwind.config.js`: `darkMode: 'class'`

This means dark mode is controlled by adding the class `dark` to the `<html>` element. `ThemeToggle.jsx` does exactly this via `useTheme`:

```js
// useTheme.js
document.documentElement.classList.toggle('dark', theme === 'dark')
```

In JSX, prefix any class with `dark:` to apply it only in dark mode:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

When the `<html>` element has the `dark` class:
- `bg-white` is overridden by `dark:bg-gray-900`
- `text-gray-900` is overridden by `dark:text-gray-100`

## Interactive states

```jsx
<button className="bg-blue-600 hover:bg-blue-700 focus:ring-2 active:scale-95 disabled:opacity-50">
```

- `hover:` — applies on mouse hover
- `focus:` — applies when element has keyboard focus
- `active:` — applies while being clicked
- `disabled:` — applies when element has `disabled` attribute

## The `cn` utility — merging classes safely

```
frontend/src/utils/cn.js
```

```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**Why two libraries?**

`clsx` handles **conditional classes**:
```js
clsx('base', isActive && 'bg-blue-600', isDisabled && 'opacity-50')
// → 'base bg-blue-600' or 'base opacity-50' or 'base'
```

`tailwind-merge` handles **Tailwind conflicts** — if you pass `bg-blue-600 bg-red-500`, it keeps only the last one. Without `twMerge`, both would apply and CSS specificity would decide unpredictably.

Combined:
```jsx
<div className={cn(
  'rounded-lg p-4 border',
  isSelected && 'ring-2 ring-blue-500 border-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

## Real example from `EstimationCards.jsx`

```jsx
<button
  key={card}
  onClick={() => !disabled && onSelect(card)}
  className={cn(
    // base styles — always applied
    'w-16 h-24 rounded-xl border-2 font-bold text-lg',
    'transition-all duration-150 cursor-pointer',
    // default state
    'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600',
    // hover state
    'hover:border-blue-400 hover:shadow-md hover:-translate-y-1',
    // selected state
    selectedCard === card && 'border-blue-500 bg-blue-50 dark:bg-blue-900 ring-2 ring-blue-300',
    // disabled state
    disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0'
  )}
>
  {card}
</button>
```

Read it top to bottom: base styles, then state-specific modifiers with `cn()` making it conditional.

## Transitions and transforms

```
transition           → enable transitions on all animatable properties
transition-colors    → transition color changes only
duration-150         → 150ms transition
ease-in-out          → timing function

scale-95             → transform: scale(0.95)  (slightly smaller)
-translate-y-1       → transform: translateY(-4px)  (lift up)
rotate-180           → transform: rotate(180deg)
```

Combined with `hover:`:
```jsx
<ChevronIcon className="transition-transform duration-200 group-hover:rotate-180" />
```

## Key takeaways

- Tailwind is utility-first: small purpose-specific classes applied directly in JSX.
- Classes follow `{property}-{value}` naming — quickly learnable patterns.
- Responsive: add breakpoint prefixes (`md:`, `lg:`) for different screen sizes.
- Dark mode: prefix any class with `dark:` — activated by `.dark` class on `<html>`.
- Interactive states: `hover:`, `focus:`, `active:`, `disabled:` prefixes.
- Use `cn()` (clsx + tailwind-merge) for conditional and merged class names.

---
**Next:** [09 — Animations with Framer Motion](09-animations.md)
