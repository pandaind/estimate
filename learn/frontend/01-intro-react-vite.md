# 01 — React + Vite: How the App Starts

## What is React?

React is a JavaScript **library for building user interfaces**. Instead of manipulating the browser's DOM directly, you describe *what* the UI should look like, and React figures out the *minimal* changes needed to make the DOM match.

The core idea: **everything is a component** — a function that takes input (called *props*) and returns UI (called *JSX*).

## What is Vite?

Vite is a **build tool and development server**. Think of it as the engine room:
- During development it serves files *without* bundling (uses native browser ES modules — much faster).
- When you run `npm run build` it bundles everything into optimised static files for deployment.

Why Vite instead of older tools like Webpack/CRA?  
**Speed** — it only processes the file you actually changed, not the whole project.

## The startup sequence

```
index.html              ← browser loads this first
  └── <script type="module" src="/src/main.jsx">
        └── main.jsx    ← ReactDOM.createRoot(…).render(<App />)
              └── App.jsx  ← defines all routes and global providers
```

### `index.html` — the shell

```html
<!-- frontend/index.html -->
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

There is only one `<div id="root">`. React takes it over and renders everything inside it.

### `main.jsx` — mounting React

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`React.StrictMode` is a development helper. It renders components twice to catch side-effect bugs — has zero effect in production.

### `App.jsx` — the application root

```jsx
// Simplified from frontend/src/App.jsx
function App() {
  return (
    <SessionProvider>        {/* global state */}
      <BrowserRouter>        {/* routing */}
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/session/*" element={<ProtectedSession />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
```

Every page in EstiMate lives inside these providers. You'll learn about each one in later chapters.

## Project structure walkthrough

```
frontend/
  index.html          ← static HTML shell
  vite.config.js      ← Vite configuration
  tailwind.config.js  ← Tailwind CSS configuration
  postcss.config.js   ← PostCSS (transforms CSS)
  package.json        ← dependencies + npm scripts

  src/
    main.jsx          ← entry point
    App.jsx           ← root component + routing
    index.css         ← global CSS (Tailwind directives)
    App.css           ← minimal extra global styles

    components/       ← all UI components
    contexts/         ← React Context (global state)
    hooks/            ← custom hooks
    utils/            ← utility functions (API calls, constants, etc.)
    assets/           ← static files (images, icons)
```

## `package.json` — what's installed and why

```json
{
  "dependencies": {
    "react": "^19",               // the core UI library
    "react-dom": "^19",           // connects React to the browser DOM
    "react-router-dom": "^7",     // client-side routing
    "axios": "^1",                // HTTP requests to the backend
    "@stomp/stompjs": "^7",       // WebSocket / real-time messaging
    "sockjs-client": "^1",        // WebSocket fallback transport
    "framer-motion": "^12",       // animations
    "tailwindcss": "^3",          // styling
    "clsx": "...",                // conditional class names
    "tailwind-merge": "...",      // merge Tailwind classes safely
    "sonner": "^2"                // toast notifications
  },
  "devDependencies": {
    "vite": "^7",                 // build tool
    "@vitejs/plugin-react": "..." // Vite plugin for JSX and Fast Refresh
  }
}
```

## npm scripts

```bash
npm run dev     # start the development server (usually http://localhost:5173)
npm run build   # create production build in dist/
npm run preview # preview the production build locally
```

## Environment variables

Vite exposes variables prefixed with `VITE_` to the browser.  
The project uses:

```
VITE_API_URL=http://localhost:8080    ← backend REST base URL
VITE_WS_URL=http://localhost:8080     ← backend WebSocket base URL
```

Inside code they are accessed as:
```js
import.meta.env.VITE_API_URL
```

## Key takeaways

- React renders UI inside a single `<div id="root">` in `index.html`.
- `main.jsx` is the entry point; it mounts the `<App />` component.
- Vite is the tool that makes `npm run dev` fast and `npm run build` produce files for production.
- All dependencies are listed in `package.json` — each one has a specific role.

---
**Next:** [02 — Components and JSX](02-components-jsx.md)
