# Backend Learning Path

This folder walks you through every concept used in the EstiMate backend — from "what is Spring Boot" to real-time WebSocket event publishing.

## Reading Order

| File | Topic | What you'll understand |
|------|--------|------------------------|
| [01-intro-spring-boot.md](01-intro-spring-boot.md) | Spring Boot + Maven | How the app starts, project structure, auto-configuration |
| [02-rest-controllers.md](02-rest-controllers.md) | REST Controllers | How HTTP requests become Java method calls |
| [03-service-layer.md](03-service-layer.md) | Services + DI | Business logic, dependency injection, interfaces |
| [04-jpa-entities.md](04-jpa-entities.md) | JPA + Spring Data | Entities, relationships, repositories, Lombok |
| [05-security-jwt.md](05-security-jwt.md) | Spring Security + JWT | Stateless auth, token validation, route protection |
| [06-websockets.md](06-websockets.md) | Spring WebSocket | STOMP broker, real-time event publishing |
| [07-exception-handling.md](07-exception-handling.md) | Exception Handling | Global error handler, custom exceptions, error responses |
| [08-database-flyway.md](08-database-flyway.md) | Database + Flyway | Schema migrations, H2 vs PostgreSQL, environment profiles |

## Technologies at a glance

```
Java 21              ← language
Spring Boot 3.2      ← framework (web, security, data)
Maven                ← build tool
Spring Data JPA      ← database ORM
Hibernate 6          ← JPA implementation
H2                   ← in-memory development database
PostgreSQL           ← production database
Flyway               ← database migration tool
Spring Security      ← authentication & authorization
JJWT 0.12            ← JWT token library
Spring WebSocket     ← real-time messaging (STOMP)
Lombok               ← code generation (no boilerplate)
Jackson              ← JSON serialization
springdoc-openapi    ← auto-generated API documentation
```

## Where code lives

```
backend/src/main/java/com/pandac/planningpoker/
  PlanningPokerApplication.java    ← Entry point (@SpringBootApplication)
  config/
    SecurityConfig.java            ← Spring Security configuration
    WebSocketConfig.java           ← STOMP broker configuration
    WebConfig.java                 ← CORS configuration
  controller/
    SessionController.java         ← REST: /api/sessions
    StoryController.java           ← REST: /api/sessions/{code}/stories
    VoteController.java            ← REST: .../votes
    UserController.java            ← REST: .../users
    AnalyticsController.java       ← REST: .../analytics
    ExportController.java          ← REST: .../export, /import
  service/
    ISessionService.java           ← interface
    SessionServiceImpl.java        ← implementation
    (same pattern for Story, User, Vote)
    AnalyticsService.java
    ExportService.java
    PlanningPokerService.java      ← orchestrator service
    WebSocketEventPublisher.java   ← sends real-time events
    VoteStatisticsCalculator.java
  model/
    Session.java                   ← JPA entity
    Story.java
    User.java
    Vote.java
    SessionSettings.java           ← embedded value object
  repository/
    SessionRepository.java         ← Spring Data JPA interface
    StoryRepository.java
    UserRepository.java
    VoteRepository.java
  dto/                             ← Data Transfer Objects (request/response shapes)
  security/
    JwtTokenService.java           ← create and validate JWTs
    JwtAuthenticationFilter.java   ← per-request JWT validation
    WebSocketAuthInterceptor.java  ← STOMP CONNECT frame JWT validation
    SessionAccessValidator.java    ← cross-session access prevention
  exception/
    GlobalExceptionHandler.java    ← @RestControllerAdvice
    SessionNotFoundException.java  ← and other custom exceptions

backend/src/main/resources/
  application.properties           ← dev configuration
  application-prod.properties      ← production overrides
  db/migration/V1__initial_schema.sql ← Flyway migration
```
