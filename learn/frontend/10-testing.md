# 10 — Frontend Testing with Vitest and Testing Library

## Why test the frontend?

Frontend code is full of logic: reducers handle state transitions, utility functions parse errors,
components conditionally render based on props. Without tests, regressions are only caught manually.

EstiMate uses:
- **Vitest** — the test runner (fast, Vite-native, Jest-compatible API)
- **@testing-library/react** — renders components and queries the DOM
- **@testing-library/jest-dom** — extra matchers like `toBeInTheDocument()`
- **jsdom** — simulates a browser DOM inside Node

---

## Setup

### Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### `vite.config.js` — add the `test` block

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',      // simulate a browser DOM
    globals: true,             // no need to import describe/it/expect in every file
    setupFiles: './src/test/setup.js',  // runs before each test file
  },
})
```

### `src/test/setup.js` — extend matchers

```js
import '@testing-library/jest-dom'
// This adds matchers like:
// expect(element).toBeInTheDocument()
// expect(element).toHaveTextContent('Hello')
// expect(button).toBeDisabled()
```

### `package.json` — test scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

`vitest run` — single run (good for CI).  
`vitest` (no `run`) — watch mode, re-runs when files change.

---

## Testing utility functions

Pure functions are the easiest to test — no DOM, no components, just input → output.

### `errorHandler.test.js`

```js
import { describe, it, expect, vi } from 'vitest'
import { parseError, handleError } from '../utils/errorHandler'

describe('parseError', () => {
  it('extracts message from Axios error with response data', () => {
    const error = {
      response: { data: { message: 'Session not found' }, status: 404 },
    }
    const result = parseError(error)
    expect(result.message).toBe('Session not found')
    expect(result.status).toBe(404)
  })

  it('returns generic message when no response (network error)', () => {
    const error = new Error('Network Error')
    const result = parseError(error)
    expect(result.message).toContain('Network Error')
  })
})
```

`vi` is Vitest's version of Jest's `jest` object — use `vi.fn()` for spies, `vi.mock()` for module mocks.

### `tokenManager.test.js`

Testing code that uses `localStorage` requires a mock:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage before any test runs
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('tokenManager', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('returns null when no token stored', () => {
    expect(tokenManager.get()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    tokenManager.set('my-jwt-string')
    expect(tokenManager.get()).toBe('my-jwt-string')
  })

  it('clears the token', () => {
    tokenManager.set('abc')
    tokenManager.clear()
    expect(tokenManager.get()).toBeNull()
  })
})
```

`vi.fn()` creates a spy — it records calls so you can assert `expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'my-jwt-string')`.

---

## Testing React components with Testing Library

Testing Library's philosophy: **test the DOM the user sees, not implementation details**.

Instead of calling component methods directly, you:
1. Render the component
2. Query the DOM as a user would (by text, role, label)
3. Fire events as a user would (click, type)
4. Assert what changed in the DOM

### `SessionContext.test.jsx`

Testing a Context + Reducer without rendering a "real" component:

```jsx
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { SessionProvider, useSession } from '../contexts/SessionContext'

// Helper component that captures state for assertions
function StateCapture({ callback }) {
  const state = useSession()
  callback(state)
  return null
}

describe('SessionContext', () => {
  it('SESSION_CREATED sets sessionCode and userId', () => {
    let capturedState = null

    render(
      <SessionProvider>
        <StateCapture callback={(s) => { capturedState = s }} />
      </SessionProvider>
    )

    act(() => {
      capturedState.dispatch({
        type: 'SESSION_CREATED',
        payload: { sessionCode: 'ABC123', userId: 42, token: 'tok' },
      })
    })

    expect(capturedState.sessionCode).toBe('ABC123')
    expect(capturedState.userId).toBe(42)
  })

  it('SESSION_LEFT clears session state', () => {
    let capturedState = null

    render(
      <SessionProvider>
        <StateCapture callback={(s) => { capturedState = s }} />
      </SessionProvider>
    )

    act(() => {
      capturedState.dispatch({ type: 'SESSION_LEFT' })
    })

    expect(capturedState.sessionCode).toBeNull()
    expect(capturedState.userId).toBeNull()
  })
})
```

Key points:
- `render()` renders into jsdom (a virtual browser DOM)
- `act()` wraps any state change so React flushes updates before assertions
- `screen.getByText()`, `screen.getByRole()` — query the rendered DOM
- No need to import `describe`/`it`/`expect` because `globals: true` is set in vite config

### Querying the DOM

```jsx
// By role (preferred — accessible and semantic)
const button = screen.getByRole('button', { name: 'Submit' })

// By text content
const heading = screen.getByText('Sprint Planning')

// By data-testid (when role/text isn't unique)
const leaveBtn = screen.getByTestId('btn-leave-session')

// Async queries — wait for element to appear
const result = await screen.findByText('Vote submitted')

// Negative — element should NOT be present
expect(screen.queryByText('Error')).not.toBeInTheDocument()
```

---

## `data-testid` attributes

One of the simplest improvements for test reliability: give key interactive elements a stable `data-testid`.

```jsx
// Before: selector breaks if button text changes
screen.getByText('Leave Session')

// After: selector is stable regardless of text changes
screen.getByTestId('btn-leave-session')
```

How they are set in the component:
```jsx
<button data-testid="btn-leave-session" onClick={handleLeave}>
  Leave Session
</button>
```

Convention used in EstiMate:
- Buttons: `btn-{action}` e.g. `btn-create-session`, `btn-reveal-votes`
- Tabs: `tab-{id}` e.g. `tab-estimate`, `tab-stories`, `tab-analytics`
- Dynamic items: `btn-{action}-{id}` e.g. `btn-activate-story-42`

The same `data-testid` attributes are used in **Playwright E2E tests**:

```js
// helpers.js (Playwright)
await page.locator('[data-testid="btn-create-session"]').click()
await page.locator('[data-testid="tab-stories"]').click()
```

This keeps unit tests and E2E tests using the same stable selectors.

---

## Running frontend tests

```bash
# From frontend/ directory
npm test           # single run
npm run test:watch # watch mode (re-runs on file save)
npm run test:coverage   # with coverage report
```

Test files live in `src/test/` and follow the naming convention `*.test.js` / `*.test.jsx`.

---

## What to test

| What | How | Example |
|---|---|---|
| Pure utility functions | Input → output assertions | `parseError`, `tokenManager` |
| Reducer logic | Dispatch action, assert new state | `SessionContext` reducer |
| Component rendering | Render, query DOM, assert presence | Button text, form labels |
| User interactions | `userEvent.click()`, `userEvent.type()` | Form submission |
| Context consumers | Wrap with provider, assert consumed value | `useSession()` hook |
| Error boundaries | Render with missing provider, assert throws | `useSession` outside provider |

Avoid testing implementation details (internal state variable names, which sub-function was called). Test what the *user* sees and experiences.
