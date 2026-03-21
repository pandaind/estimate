# 06 — API Communication with Axios

## How the frontend talks to the backend

EstiMate is a **decoupled** architecture:
- Backend (Spring Boot) runs on `localhost:8080` — exposes a **REST API**.
- Frontend (React) runs on `localhost:5173` — calls that API via **HTTP requests**.

The library used for those HTTP requests is **Axios**.

## What is a REST API?

REST (Representational State Transfer) is a convention for building APIs. The key ideas:
- Resources are identified by URLs: `/api/sessions`, `/api/sessions/ABC123/stories`
- HTTP **methods** (verbs) describe the operation:

| Method | Meaning | Example |
|--------|---------|---------|
| GET    | Read    | `GET /api/sessions/ABC123` |
| POST   | Create  | `POST /api/sessions` (create new session) |
| PUT    | Replace | `PUT /api/sessions/ABC123/stories/7` |
| PATCH  | Partial update | `PATCH /api/sessions/ABC123/settings` |
| DELETE | Delete  | `DELETE /api/sessions/ABC123/stories/7` |

Responses come back as **JSON**.

## Why Axios instead of `fetch`?

The browser has a built-in `fetch` function. Axios adds on top of it:
- Automatic JSON parsing (with `fetch` you need `.json()` every time)
- Request/response **interceptors** (middleware for all requests)
- Better error handling (non-2xx responses throw automatically)
- Easy base URL configuration
- Handles older browsers

## The Axios instance — `api.js`

```
frontend/src/utils/api.js
```

Instead of hardcoding the URL everywhere, the project creates a single **Axios instance** with shared config:

```js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})
```

Every request made through `apiClient` will automatically have the `Content-Type` header and use the base URL.

## Interceptors — middleware for every request

### Request interceptor — inject the JWT token

```js
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

What this does: **before** every HTTP request is sent, it reads the JWT from `localStorage` and adds it to the `Authorization` header. Components never need to think about this — it happens automatically.

### Response interceptor — handle errors globally

```js
apiClient.interceptors.response.use(
  (response) => response,   // success: just pass it through
  (error) => {
    if (error.response?.status === 401) {
      tokenManager.clear()  // token expired or invalid — clear it
    }
    // Show a toast notification with the error message
    toast.error(error.response?.data?.message || 'Something went wrong')
    return Promise.reject(error)  // still reject so callers can handle it
  }
)
```

Benefits: error toasts appear consistently across the entire app without any component writing its own error handling logic.

## Token management

```js
const TOKEN_KEY = 'planning_poker_token'

export const tokenManager = {
  get:   ()      => localStorage.getItem(TOKEN_KEY),
  set:   (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: ()      => localStorage.removeItem(TOKEN_KEY),
}
```

`localStorage` persists across page refreshes. When the user joins a session:
1. Backend returns a JWT.
2. `tokenManager.set(jwt)` stores it.
3. Every subsequent request includes it via the interceptor.
4. On 401 error (expired/invalid), `tokenManager.clear()` removes it.

## The API modules

`api.js` exports separate objects grouping related API calls:

```js
export const sessionAPI = {
  create: (data)         => apiClient.post('/api/sessions', data),
  get:    (code)         => apiClient.get(`/api/sessions/${code}`),
  join:   (code, data)   => apiClient.post(`/api/sessions/${code}/join`, data),
  leave:  (code)         => apiClient.post(`/api/sessions/${code}/leave`),
  reveal: (code)         => apiClient.post(`/api/sessions/${code}/reveal`),
}

export const storyAPI = {
  getAll:  (code)        => apiClient.get(`/api/sessions/${code}/stories`),
  create:  (code, data)  => apiClient.post(`/api/sessions/${code}/stories`, data),
  update:  (code, id, d) => apiClient.put(`/api/sessions/${code}/stories/${id}`, d),
  delete:  (code, id)    => apiClient.delete(`/api/sessions/${code}/stories/${id}`),
  activate:(code, id)    => apiClient.post(`/api/sessions/${code}/stories/${id}/activate`),
}

export const voteAPI = {
  cast:    (code, storyId, data) => apiClient.post(
    `/api/sessions/${code}/stories/${storyId}/votes`, data
  ),
}

// ... analyticsAPI, exportAPI, userAPI, utilityAPI
```

Usage in a component:

```jsx
import { storyAPI } from '../utils/api'

const response = await storyAPI.create(sessionCode, { title: 'Login page' })
const newStory = response.data
```

## Making API calls in components

The typical pattern: call the API in an async function, update local state on success:

```jsx
async function handleCreateStory(formData) {
  try {
    const response = await storyAPI.create(sessionCode, formData)
    setStories(prev => [...prev, response.data])  // add to local list
    toast.success('Story added!')
  } catch (error) {
    // error toast already shown by the response interceptor
    // only add extra logic if needed
  }
}
```

Notice the `try/catch`: errors don't propagate silently. The interceptor already shows the toast, so here you only need component-specific recovery logic.

## Loading and error states

```jsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

async function loadSession() {
  setLoading(true)
  try {
    const res = await sessionAPI.get(code)
    setSession(res.data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)  // always reset loading, even on error
  }
}

if (loading) return <Spinner />
if (error)   return <ErrorMessage msg={error} />
return <SessionView session={session} />
```

## CORS — why the backend must allow the frontend

When the frontend on `localhost:5173` calls the backend on `localhost:8080`, the browser enforces **CORS** (Cross-Origin Resource Sharing). The backend must explicitly allow this or the browser blocks the response.

In the Spring Boot backend:
```java
// WebConfig.java
registry.addMapping("/api/**")
  .allowedOrigins(corsAllowedOrigins)  // from env var CORS_ALLOWED_ORIGINS
  .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
  .allowedHeaders("*")
```

You will see this in action when you run the app locally — both servers must be running.

## The full request flow

```
Component calls storyAPI.create(code, data)
  → Axios request interceptor adds: Authorization: Bearer <token>
    → HTTP POST /api/sessions/ABC123/stories
      → Spring Security validates JWT
        → SessionController.createStory() runs
          → Returns 201 Created with story JSON
        → response interceptor: passes through (2xx = success)
      → response.data is the story object
    → Component updates state: setStories([...stories, newStory])
  → React re-renders with the new story in the list
```

## Key takeaways

- Axios is an HTTP client — it's how the frontend sends requests to the backend REST API.
- A shared **Axios instance** with `baseURL` means you never repeat the server address.
- **Request interceptors** automatically attach the JWT to every request.
- **Response interceptors** handle errors globally (toast notifications, 401 cleanup).
- `tokenManager` wraps `localStorage` — the token persists across page refreshes.
- API logic is centralised in `api.js` — components just call `storyAPI.create(...)` etc.

---
**Next:** [07 — Real-Time with WebSockets](07-websockets.md)
