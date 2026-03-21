# 11 — Accessibility (WCAG)

## Why accessibility matters

Accessibility ensures your app is usable by everyone — including people using screen readers, keyboard navigation, or other assistive technologies. WCAG (Web Content Accessibility Guidelines) defines the standard. Key principles:

1. **Perceivable** — information must be presentable in ways users can perceive
2. **Operable** — UI must be navigable by keyboard and assistive tech
3. **Understandable** — content and operation must be predictable
4. **Robust** — content must work with current and future assistive technologies

---

## Icon-only buttons need labels

A button with only an icon has no text for screen readers. Without a label, a screen reader announces just "button" — useless.

### The problem

```jsx
{/* ❌ Screen reader says: "button" */}
<button onClick={handleCopy}>
  <FaCopy />
</button>
```

### The fix — aria-label

```jsx
{/* ✅ Screen reader says: "Copy session code" */}
<button onClick={handleCopy} aria-label="Copy session code">
  <FaCopy />
</button>
```

### Real examples from EstiMate

**SessionHeader.jsx** — six icon-only action buttons:

```jsx
<button onClick={copyToClipboard} aria-label="Copy session code">
  <FaCopy />
</button>
<button onClick={() => setShowTutorial(true)} aria-label="Show tutorial">
  <FaQuestion />
</button>
<button onClick={() => setShowExport(true)} aria-label="Export session data">
  <FaFileExport />
</button>
<button onClick={() => setShowImport(true)} aria-label="Import session data">
  <FaFileImport />
</button>
<button onClick={() => setShowSettings(true)} aria-label="Session settings">
  <FaCog />
</button>
<button onClick={handleLeaveSession} aria-label="Leave session">
  <FaSignOutAlt />
</button>
```

**ThemeToggle.jsx** — dynamic label based on state:

```jsx
<button onClick={toggleTheme} aria-label={title}>
  {darkMode ? <FaSun /> : <FaMoon />}
</button>
```

**EstimationCards.jsx** — interactive rating stars:

```jsx
<button
  onClick={() => setConfidenceLevel(level)}
  aria-label={`Confidence level ${level}`}
>
  <FaStar />
</button>
```

---

## Form elements need labels

Selects, inputs, and range sliders must be identifiable by screen readers. If there's no visible `<label>`, use `aria-label`.

### Select elements

```jsx
{/* ❌ Screen reader doesn't know what this selects */}
<select value={sizingMethod} onChange={handleChange}>
  <option value="fibonacci">Fibonacci</option>
</select>

{/* ✅ Clear purpose */}
<select
  value={sizingMethod}
  onChange={handleChange}
  aria-label="Sizing method"
>
  <option value="fibonacci">Fibonacci</option>
</select>
```

### Range inputs

```jsx
<input
  type="range"
  min={1}
  max={30}
  value={timerDuration}
  onChange={(e) => setTimerDuration(e.target.value)}
  aria-label="Timer duration in minutes"
/>
```

### Text inputs with placeholder but no label

```jsx
<input
  type="text"
  placeholder="Add a tag..."
  value={tagInput}
  onChange={(e) => setTagInput(e.target.value)}
  aria-label="Add tag"
/>
```

---

## Modal dialogs

Modals need ARIA roles so assistive technology knows the content is a dialog that traps focus.

### Required attributes

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Edit story"    {/* or aria-labelledby="title-id" */}
  className="fixed inset-0 ..."
>
  <button onClick={onClose} aria-label="Close">
    <FaTimes />
  </button>
  {/* modal content */}
</div>
```

| Attribute | Purpose |
|---|---|
| `role="dialog"` | Tells screen readers this is a dialog |
| `aria-modal="true"` | Indicates content behind is inert (not interactive) |
| `aria-label` | Names the dialog (if no visible heading) |
| `aria-labelledby` | Points to an element that names the dialog |

### EstiMate modals

Six modals were updated: `StoryEditor`, `SessionSettings`, `UserProfile`, `ExportModal`, `ImportModal`, `TutorialModal`. Each outer wrapper received:

```jsx
<div className="fixed inset-0 ..." role="dialog" aria-modal="true">
```

Each close button received:

```jsx
<button onClick={onClose} aria-label="Close">
  <FaTimes />
</button>
```

---

## Tab components

Tab UIs need ARIA roles to convey structure. A `tablist` contains `tab` items, and each tab reports whether it's selected.

### Pattern

```jsx
<div role="tablist" className="flex border-b ...">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={activeTab === tab.id ? 'active-styles' : 'inactive-styles'}
    >
      {tab.label}
    </button>
  ))}
</div>
```

| Attribute | Purpose |
|---|---|
| `role="tablist"` | Container that holds the tab buttons |
| `role="tab"` | Individual tab button |
| `aria-selected="true"` | Marks the currently active tab |

### EstiMate example — SessionTabs.jsx

```jsx
<div role="tablist" className="flex border-b ...">
  <button
    role="tab"
    aria-selected={activeTab === 'stories'}
    onClick={() => setActiveTab('stories')}
    className={...}
  >
    Stories ({storyCount})
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'analytics'}
    onClick={() => setActiveTab('analytics')}
    className={...}
  >
    Analytics
  </button>
</div>
```

---

## Live regions and alerts

Dynamic content that updates (notifications, connection status) should announce itself to screen readers.

### role="alert"

```jsx
{/* Announced immediately by screen reader */}
<div role="alert" className="bg-yellow-500 ...">
  Connection lost. Reconnecting...
</div>
```

### Where EstiMate uses alerts

- **ConnectionStatus.jsx** — WebSocket disconnect banner uses `role="alert"` so users know the connection dropped
- **RealTimeNotifications.jsx** — toast notifications with dismiss buttons that have `aria-label="Dismiss notification"`

---

## Checklist for new components

When building a new interactive component, run through this checklist:

| Element | Required |
|---|---|
| Icon-only button | `aria-label` describing the action |
| Form input without visible label | `aria-label` or `aria-labelledby` |
| Modal/dialog | `role="dialog"` + `aria-modal="true"` + label |
| Tab interface | `role="tablist"` + `role="tab"` + `aria-selected` |
| Dynamic content | `role="alert"` or `aria-live="polite"` |
| Close/dismiss button | `aria-label="Close"` or `aria-label="Dismiss"` |
| Toggle button | `aria-label` reflecting current/target state |
| Image/icon with meaning | `aria-label` or `alt` text |
| Decorative image/icon | `aria-hidden="true"` |

---

## Testing accessibility

### Browser DevTools

1. Open Chrome DevTools → **Lighthouse** tab → check "Accessibility" → **Analyze page load**
2. Open Chrome DevTools → Elements panel → select an element → **Accessibility** pane shows computed ARIA tree

### Screen reader testing

- **macOS**: VoiceOver (Cmd + F5 to toggle) — navigate with Tab key, listen to announcements
- Tab through your UI — every interactive element should be reachable and identifiable

### Automated tools

- **axe-core** — `npm install @axe-core/react` for automatic checks during development
- **eslint-plugin-jsx-a11y** — ESLint rules that catch missing labels, roles, etc.
