package com.pandac.planningpoker.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class JwtTokenService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String sessionCode, Long userId, UserRole role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sessionCode", sessionCode);
        claims.put("userId", userId);
        claims.put("role", role.getRoleName());

        return Jwts.builder()
                .claims(claims)
                .subject(sessionCode + ":" + userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            throw new JwtValidationException("Token expired");
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            throw new JwtValidationException("Invalid token");
        } catch (JwtException e) {
            log.warn("JWT validation error: {}", e.getMessage());
            throw new JwtValidationException("Token validation failed");
        }
    }

    public String extractSessionCode(String token) {
        return validateToken(token).get("sessionCode", String.class);
    }

    public Long extractUserId(String token) {
        return validateToken(token).get("userId", Long.class);
    }

    public String extractRole(String token) {
        return validateToken(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            validateToken(token);
            return true;
        } catch (JwtValidationException e) {
            return false;
        }
    }
}
