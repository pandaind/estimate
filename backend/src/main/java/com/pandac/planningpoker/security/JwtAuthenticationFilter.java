package com.pandac.planningpoker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                if (jwtTokenService.isTokenValid(token)) {
                    String sessionCode = jwtTokenService.extractSessionCode(token);
                    Long userId = jwtTokenService.extractUserId(token);
                    String roleString = jwtTokenService.extractRole(token);
                    
                    // Parse role to enum (validates role is legitimate)
                    UserRole role = UserRole.fromString(roleString);
                    
                    // Create authentication with role-based authority
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role.getAuthority());
                    UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(
                                    sessionCode + ":" + userId,
                                    null,
                                    Collections.singletonList(authority));
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Store additional details for easy access
                    request.setAttribute("sessionCode", sessionCode);
                    request.setAttribute("userId", userId);
                    request.setAttribute("role", role);
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtValidationException e) {
                log.warn("JWT validation failed: {}", e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
