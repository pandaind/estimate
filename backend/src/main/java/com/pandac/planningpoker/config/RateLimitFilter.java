package com.pandac.planningpoker.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple per-IP rate limiter for the two most abuse-prone public endpoints:
 * <ul>
 *   <li>{@code POST /api/sessions}        - create session: 10 req / minute</li>
 *   <li>{@code POST /api/sessions/x/join} - join session:   20 req / minute</li>
 * </ul>
 * Uses Bucket4j in-process token-bucket buckets keyed by remote IP.
 * For multi-instance deployments replace the in-memory map with a shared
 * cache (Redis + bucket4j-redis) and adjust the limits to taste.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /** Create-session: 10 requests per minute per IP. */
    private final Map<String, Bucket> createSessionBuckets = new ConcurrentHashMap<>();
    /** Join-session:   20 requests per minute per IP. */
    private final Map<String, Bucket> joinSessionBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String path   = request.getRequestURI();

        boolean isCreate = "POST".equalsIgnoreCase(method) && "/api/sessions".equals(path);
        boolean isJoin   = "POST".equalsIgnoreCase(method) && path.matches("/api/sessions/[^/]+/join");

        if (isCreate || isJoin) {
            String ip = resolveClientIp(request);
            Bucket bucket = isCreate
                    ? createSessionBuckets.computeIfAbsent(ip, k -> buildBucket(10))
                    : joinSessionBuckets.computeIfAbsent(ip, k -> buildBucket(20));

            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                    "{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private static Bucket buildBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.classic(requestsPerMinute,
                Refill.greedy(requestsPerMinute, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        // Trust X-Forwarded-For when running behind a reverse proxy/load balancer.
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
