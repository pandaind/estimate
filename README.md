# EstiMate

Real-time collaborative story estimation for agile teams.

## Features

- Multiple sizing methods (Fibonacci, T-Shirt, Powers of 2, Linear, Custom)
- Real-time WebSocket collaboration
- Session management with shareable codes
- Story backlog management
- Vote analytics and export

## Tech Stack

**Backend:** Spring Boot 3.2.0, Java 21, H2 Database, WebSocket  
**Frontend:** React 18, Vite, TailwindCSS, Framer Motion

## Quick Start

**Prerequisites:** Java 21+, Node.js 18+, Maven

```bash
# Backend
cd backend
mvn spring-boot:run
# API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html

# Frontend
cd frontend
npm install && npm run dev
# App: http://localhost:5173
```

## Project Structure

```
├── backend/          # Spring Boot API
├── frontend/         # React UI
├── api-testing/      # Newman API tests
└── e2e-tests/        # Playwright E2E tests
```

## Usage

1. Create session with sizing method
2. Share 6-character code with team
3. Add stories to backlog
4. Vote on estimates
5. Reveal and finalize

## Testing

**API Tests (Newman/Postman):**
```bash
cd api-testing
./run-tests.sh
```

**E2E Tests (Playwright):**
```bash
cd e2e-tests
./run-tests.sh
```

## Documentation

- [Future Features & Roadmap](FUTURE_FEATURES.md)
- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Testing Guide](api-testing/README.md)
- [E2E Testing Guide](e2e-tests/README.md)

## License

MIT
