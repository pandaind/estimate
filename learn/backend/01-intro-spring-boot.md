# 01 — Introduction to Spring Boot

## What is Spring?

**Spring** is a Java framework for building applications. It provides solutions for the most common application concerns: web requests, database access, security, and more.

**Spring Boot** is Spring with **auto-configuration** — it makes sensible decisions based on what's on the classpath, so you spend almost zero time on setup.

For example: if `spring-boot-starter-web` is in `pom.xml`, Spring Boot automatically:
- Starts an embedded **Tomcat** web server on port 8080
- Registers a `DispatcherServlet` to route HTTP requests
- Configures Jackson for JSON serialization/deserialization

You write the business logic. Spring Boot handles the plumbing.

## Maven — the build tool

Maven is to Java what `npm` is to JavaScript. It manages:
- **Dependencies** (libraries downloaded from the internet)
- **Building** (compiling, testing, packaging)
- **Plugin execution** (running tools like Flyway)

The equivalent of `package.json` is **`pom.xml`** (Project Object Model).

### Key parts of `pom.xml`

```xml
<!-- The parent provides Spring Boot's version management -->
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.2.0</version>
</parent>

<!-- Project coordinates — like a package name -->
<groupId>com.pandac</groupId>
<artifactId>planning-poker</artifactId>
<version>0.0.1-SNAPSHOT</version>

<!-- Dependencies — libraries this project uses -->
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- no version — managed by parent -->
  </dependency>
</dependencies>
```

### Starters

Spring Boot "starters" are pre-packaged dependency groups. One line pulls in everything needed for a feature:

| Starter | What it adds |
|---------|-------------|
| `spring-boot-starter-web` | Tomcat, Spring MVC, Jackson |
| `spring-boot-starter-security` | Spring Security filter chain |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data JPA, transaction management |
| `spring-boot-starter-websocket` | Spring WebSocket, STOMP support |
| `spring-boot-starter-validation` | Bean Validation (javax.validation) |

Equivalent Maven commands to npm:

```bash
mvn spring-boot:run    # ≈ npm run dev   (start the app)
mvn package           # ≈ npm run build  (creates a .jar file)
mvn test              # ≈ npm test
```

## The entry point

```java
// backend/src/main/java/com/pandac/planningpoker/PlanningPokerApplication.java
@SpringBootApplication
public class PlanningPokerApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlanningPokerApplication.class, args);
    }
}
```

`@SpringBootApplication` is a shortcut for three annotations:
- `@Configuration` — this class can define Spring beans
- `@EnableAutoConfiguration` — let Spring Boot auto-configure
- `@ComponentScan` — scan this package (and children) for components

`SpringApplication.run()` boots the IoC container (the ApplicationContext), triggers auto-configuration, starts the web server, and the app is live.

## The IoC Container and Beans

Spring's core principle is **Inversion of Control (IoC)**: instead of your code creating its dependencies with `new`, Spring creates them and injects them where needed.

Objects managed by Spring are called **Beans**. Spring creates one instance of each bean (singleton by default) and handles their lifecycle.

How Spring knows what to create:

```java
@Service          // marks this as a service bean
@Repository       // marks this as a repository bean  
@Controller       // marks this as a web controller bean
@Component        // generic bean marker
```

All of these are specialisations of `@Component`. Spring's component scan finds them and registers them.

## The package structure

```
com.pandac.planningpoker
  ├── config/        ← configuration classes (@Configuration beans)
  ├── controller/    ← web layer (HTTP request handlers)
  ├── service/       ← business logic
  ├── repository/    ← database access
  ├── model/         ← JPA entities (database tables)
  ├── dto/           ← Data Transfer Objects (API request/response shapes)
  ├── security/      ← authentication and authorization
  └── exception/     ← custom exceptions and global handler
```

This is the standard layered architecture. Each layer has a single responsibility:
- **Controller** — receives HTTP request, validates input, calls service, returns response
- **Service** — contains business logic, calls repositories, orchestrates operations
- **Repository** — talks to the database (SQL queries)
- **Model** — represents database tables as Java classes

## `application.properties` — configuration

```properties
# backend/src/main/resources/application.properties

# server
server.port=8080

# database (H2 in-memory for development)
spring.datasource.url=jdbc:h2:mem:planningpoker
spring.datasource.driver-class-name=org.h2.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=create-drop    # recreate tables on every start
spring.jpa.show-sql=true                     # log SQL queries (useful for learning)

# Flyway
spring.flyway.enabled=false                  # off in dev (H2 + ddl-auto handles it)

# JWT
jwt.secret=${JWT_SECRET:dev-secret-key}      # ${ENV_VAR:default} syntax
jwt.expiration=7200000                       # 2 hours in milliseconds

# H2 console (web UI to browse the in-memory database)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**Development tip**: With `spring.jpa.show-sql=true`, Spring prints every SQL query to the console. This is invaluable for learning how JPA operations translate to SQL.

**H2 console**: While the dev server is running, open `http://localhost:8080/h2-console` to browse the in-memory database and run SQL queries.

## Running the app

```bash
cd backend
mvn spring-boot:run
```

Or from IntelliJ/VS Code: run the `PlanningPokerApplication` main method.

**What happens at startup:**
1. Spring scans all packages under `com.pandac.planningpoker`
2. Creates and wires all beans (controllers, services, repositories)
3. Configures security, WebSocket, database connection
4. H2 creates tables based on JPA entities (because `ddl-auto=create-drop`)
5. Tomcat starts on port 8080
6. `Started PlanningPokerApplication in 3.2 seconds` — ready!

## Auto-generated API docs

With `springdoc-openapi` on the classpath, Spring Boot auto-generates:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html` — interactive API explorer
- **OpenAPI JSON**: `http://localhost:8080/api-docs`

This is a great way to explore all available endpoints, their parameters, and response structures while learning the backend.

## Key takeaways

- Spring Boot is Spring with auto-configuration — write business logic, not plumbing.
- Maven manages dependencies (`pom.xml`) and builds the project.
- `@SpringBootApplication` is the entry point; `SpringApplication.run()` boots everything.
- Spring manages "beans" (singletons) via IoC — you annotate classes, Spring creates and injects them.
- `application.properties` configures the application — ports, DB URL, JWT settings, etc.
- Use `spring.jpa.show-sql=true` and the H2 console to observe what's happening in the database.

---
**Next:** [02 — REST Controllers](02-rest-controllers.md)
