# Frontend

React UI with real-time updates.

## Stack

- React 19
- Vite 7
- TailwindCSS
- Framer Motion
- Axios

## Run

```bash
npm install
npm run dev
```

App: http://localhost:5173

## Build

```bash
npm run build
```

## Test

```bash
npm test           # single run
npm run test:watch # watch mode
```

## Security Note

JWT tokens are stored in `localStorage`. This makes them readable to any JavaScript on the page (XSS attack vector). For production deployments handling sensitive data, migrate to `HttpOnly` / `Secure` / `SameSite=Strict` cookies managed server-side so the token is never accessible to JavaScript at all.
