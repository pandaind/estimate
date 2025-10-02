# Backend

Spring Boot REST API with WebSocket support.

## Stack

- Java 21
- Spring Boot 3.2.0
- H2 Database (in-memory)
- WebSocket (STOMP)
- Maven

## Run

```bash
mvn spring-boot:run
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/api-docs
- H2 Console: http://localhost:8080/h2-console
  - JDBC: `jdbc:h2:mem:planningpoker`
  - User: `sa` / Password: `password`

## Build

```bash
mvn clean package
```
