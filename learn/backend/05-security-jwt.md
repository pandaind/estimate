# 05 — Spring Security and JWT Authentication

## Why authentication?

Without authentication, anyone could:
- Reveal votes in someone else's planning session
- Delete stories they don't own
- Access analytics without being part of the session

**Authentication** = proving who you are.  
**Authorization** = what you're allowed to do once identified.

## How JWT-based stateless auth works

Traditional session-based auth keeps user state on the *server* (in memory or a database). **JWT (JSON Web Token)** is stateless — the token itself carries the information.

```
1. User joins session → server creates a JWT signed with a secret key
2. User stores the JWT (localStorage)
3. Every subsequent request includes the JWT in the header: Authorization: Bearer <token>
4. Server validates the JWT signature → no database lookup needed
5. Server extracts claims from the token → knows who this is
```

### JWT structure

A JWT is three Base64URL-encoded parts separated by dots:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsInNlc3Npb24iOiJBQkMxMjMifQ.abcdefgh
  HEADER              PAYLOAD                                         SIGNATURE
```

**Header**: algorithm used (`HS256` = HMAC-SHA256)  
**Payload**: claims (data about the user): `sub` (subject = userId), `sessionCode`, `role`, `iat` (issued at), `exp` (expires at)  
**Signature**: `HMAC-SHA256(base64(header) + "." + base64(payload), secretKey)` — tamper-evident

If anyone modifies the payload (e.g., changes userId), the signature won't match and the token is rejected. The secret key is only on the server.

## `JwtTokenService` — creating and validating tokens

```java
@Service
public class JwtTokenService {

    @Value("${jwt.secret}")           // from application.properties
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs;        // 7_200_000 = 2 hours

    // Create a token for a user
    public String generateToken(Long userId, String sessionCode) {
        return Jwts.builder()
            .subject(String.valueOf(userId))     // "sub" claim = userId
            .claim("sessionCode", sessionCode)   // custom claim
            .claim("role", "PARTICIPANT")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())           // sign with HMAC-SHA256
            .compact();
    }

    // Validate a token and extract user ID
    public Long extractUserId(String token) {
        return Long.parseLong(
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject()
        );
    }

    // Validate a token and extract session code
    public String extractSessionCode(String token) {
        return (String) getClaims(token).get("sessionCode");
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);  // throws if invalid/expired
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
```

## `JwtAuthenticationFilter` — validating every request

This filter runs **before** every HTTP request reaches a controller:

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            // No token → skip (security config will block private endpoints)
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);  // strip "Bearer "

        if (jwtService.isTokenValid(token)) {
            Long userId = jwtService.extractUserId(token);
            String sessionCode = jwtService.extractSessionCode(token);

            // Create an authentication object and put it in Spring Security's context
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userId.toString(),  // "principal" = userId  
                    null,               // credentials (not needed)
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);  // continue to next filter/controller
    }
}
```

After this filter runs, `SecurityContextHolder.getContext().getAuthentication()` returns the user's identity for any code downstream.

## `SecurityConfig` — declaring what's public and what's protected

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())          // stateless API — no CSRF needed
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(STATELESS) // never create HTTP sessions (JWT only)
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — no JWT required
                .requestMatchers(HttpMethod.POST, "/api/sessions").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/sessions/{code}").permitAll()
                .requestMatchers("/api/sessions/*/join").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/sizing-methods").permitAll()
                .requestMatchers("/ws/**").permitAll()         // WebSocket handshake
                .requestMatchers("/h2-console/**").permitAll() // dev only
                .requestMatchers("/swagger-ui/**").permitAll() // API docs
                .anyRequest().authenticated()                  // everything else needs JWT
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(h -> h.frameOptions(fo -> fo.sameOrigin())) // for H2 console iframes
            .build();
    }
}
```

`anyRequest().authenticated()` — any endpoint not listed above requires a valid JWT.

## Why `STATELESS` and disable CSRF?

**STATELESS**: Spring Security's default is to create an `HttpSession` to remember the authenticated user. With JWT, we don't want that — the token is the session. `STATELESS` tells Spring to never create a server-side session.

**CSRF disabled**: CSRF (Cross-Site Request Forgery) protection uses a session-bound token. Since we have no server-side session (JWT-only), CSRF protection is irrelevant. Modern CORS configuration prevents cross-site requests.

## `SessionAccessValidator` — cross-session protection

Even with valid JWT, a user should only access their own session. The validator enforces this:

```java
@Component
public class SessionAccessValidator {

    private final JwtTokenService jwtService;

    public void validateAccess(HttpServletRequest request, String sessionCode) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        String tokenSessionCode = jwtService.extractSessionCode(token);

        if (!tokenSessionCode.equals(sessionCode)) {
            throw new UnauthorizedAccessException(
                "Your token is not valid for session " + sessionCode
            );
        }
    }
}
```

This prevents: user in session `ABC123` from calling `GET /api/sessions/XYZ789/stories`.

## `WebSocketAuthInterceptor` — WebSocket authentication

HTTP filters don't run for WebSocket connections. Authentication happens at STOMP CONNECT time via a `ChannelInterceptor`:

```java
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing WebSocket authorization");
            }

            String token = authHeader.substring(7);
            if (!jwtService.isTokenValid(token)) {
                throw new IllegalArgumentException("Invalid WebSocket token");
            }

            // Set authentication on the WebSocket session
            Long userId = jwtService.extractUserId(token);
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of()
            ));
        }

        return message;
    }
}
```

This intercepts the STOMP `CONNECT` frame. Invalid token = connection rejected.

## The complete auth flow

```
User submits name to join session
  → POST /api/sessions/ABC123/join (no JWT needed — public endpoint)
    → SessionServiceImpl.joinSession() creates User in DB
      → JwtTokenService.generateToken(userId, "ABC123")
        → Returns JWT: "eyJ..."
    → Response: { session: {...}, user: {...}, token: "eyJ..." }
  → Frontend: tokenManager.set("eyJ...")

User fetches stories
  → GET /api/sessions/ABC123/stories (JWT needed)
    Header: Authorization: Bearer eyJ...
    → JwtAuthenticationFilter validates signature, extracts userId
    → SecurityContextHolder: { principal: "42", session: "ABC123" }
    → SessionAccessValidator: token.sessionCode === "ABC123" ✓
    → StoryController.getStories() runs
    → Returns 200 OK with stories

User connects WebSocket
  → STOMP CONNECT with header Authorization: Bearer eyJ...
    → WebSocketAuthInterceptor validates token
    → WebSocket session established with userId principal

Token expires after 2 hours
  → Next API call returns 401 Unauthorized
    → Axios response interceptor: tokenManager.clear()
    → Redirect to home (user must rejoin)
```

## Environment variable for the secret

```properties
# application.properties
jwt.secret=${JWT_SECRET:dev-only-secret-change-in-production}
```

The `${ENV_VAR:default}` syntax: if `JWT_SECRET` env var is set, use it; otherwise use the fallback. In production, **always** set a strong random `JWT_SECRET` — the default is public knowledge.

## Key takeaways

- JWT is a self-contained, signed token — no server-side session needed.
- `JwtAuthenticationFilter` validates every request's Bearer token before it reaches controllers.
- `SecurityConfig.authorizeHttpRequests()` declares public vs. protected endpoints.
- `STATELESS` session policy + disabled CSRF is the correct setup for JWT APIs.
- `SessionAccessValidator` prevents cross-session access (horizontal privilege escalation).
- `WebSocketAuthInterceptor` authenticates STOMP CONNECT frames using the same JWT.
- Never hardcode the JWT secret — read it from an environment variable.

---
**Next:** [06 — Spring WebSocket and Real-Time Events](06-websockets.md)
