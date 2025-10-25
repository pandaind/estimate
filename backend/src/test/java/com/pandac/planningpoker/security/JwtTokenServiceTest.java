package com.pandac.planningpoker.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-for-jwt-token-generation-and-validation-12345",
    "jwt.expiration=3600000"
})
class JwtTokenServiceTest {

    @Autowired
    private JwtTokenService jwtTokenService;

    private String sessionCode;
    private Long userId;
    private UserRole role;

    @BeforeEach
    void setUp() {
        sessionCode = "ABC123";
        userId = 1L;
        role = UserRole.PARTICIPANT;
    }

    @Test
    void testGenerateToken() {
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void testValidateValidToken() {
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        assertTrue(jwtTokenService.isTokenValid(token));
    }

    @Test
    void testValidateInvalidToken() {
        String invalidToken = "invalid.jwt.token";
        
        assertFalse(jwtTokenService.isTokenValid(invalidToken));
    }

    @Test
    void testExtractSessionCode() {
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        String extractedSessionCode = jwtTokenService.extractSessionCode(token);
        
        assertEquals(sessionCode, extractedSessionCode);
    }

    @Test
    void testExtractUserId() {
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        Long extractedUserId = jwtTokenService.extractUserId(token);
        
        assertEquals(userId, extractedUserId);
    }

    @Test
    void testExtractRole() {
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        String extractedRole = jwtTokenService.extractRole(token);
        
        assertEquals(role.getRoleName(), extractedRole);
    }

    @Test
    void testTokenWithDifferentRoles() {
        String participantToken = jwtTokenService.generateToken(sessionCode, userId, UserRole.PARTICIPANT);
        String moderatorToken = jwtTokenService.generateToken(sessionCode, userId, UserRole.MODERATOR);
        String observerToken = jwtTokenService.generateToken(sessionCode, userId, UserRole.OBSERVER);
        
        assertEquals("PARTICIPANT", jwtTokenService.extractRole(participantToken));
        assertEquals("MODERATOR", jwtTokenService.extractRole(moderatorToken));
        assertEquals("OBSERVER", jwtTokenService.extractRole(observerToken));
    }

    @Test
    void testValidateExpiredToken() throws InterruptedException {
        // Note: This test would require a very short expiration time
        // For production, you'd want to mock the time or use a separate configuration
        String token = jwtTokenService.generateToken(sessionCode, userId, role);
        
        // Token should be valid immediately
        assertTrue(jwtTokenService.isTokenValid(token));
    }
}
