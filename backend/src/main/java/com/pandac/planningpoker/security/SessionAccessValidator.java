package com.pandac.planningpoker.security;

import com.pandac.planningpoker.exception.SessionMembershipException;
import com.pandac.planningpoker.exception.UnauthorizedAccessException;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.repository.SessionRepository;
import com.pandac.planningpoker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

/**
 * Service for validating session access based on JWT token claims.
 * Ensures users can only access sessions they belong to.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionAccessValidator {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final HttpServletRequest request;

    /**
     * Validate that the authenticated user has access to the specified session.
     * 
     * @param sessionCode The session code being accessed
     * @throws UnauthorizedAccessException if user doesn't belong to the session
     */
    public void validateSessionAccess(String sessionCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedAccessException("User is not authenticated");
        }
        
        // Extract session code from JWT token (stored in request attributes by filter)
        String tokenSessionCode = (String) request.getAttribute("sessionCode");
        Long tokenUserId = (Long) request.getAttribute("userId");
        
        if (tokenSessionCode == null || tokenUserId == null) {
            throw new UnauthorizedAccessException("Invalid authentication token");
        }
        
        // Validate session code matches
        if (!tokenSessionCode.equals(sessionCode)) {
            log.warn("Session access violation: User {} attempted to access session {} but token is for session {}", 
                     tokenUserId, sessionCode, tokenSessionCode);
            throw new UnauthorizedAccessException(
                "Access denied: Your token is for session " + tokenSessionCode + ", not " + sessionCode);
        }
        
        // Validate user still exists and is active in the session
        Optional<User> userOpt = userRepository.findById(tokenUserId);
        if (userOpt.isEmpty()) {
            throw new UnauthorizedAccessException("User no longer exists");
        }
        
        User user = userOpt.get();
        if (!user.getIsActive()) {
            throw new UnauthorizedAccessException("User is no longer active in this session");
        }
        
        // Validate session still exists
        Optional<Session> sessionOpt = sessionRepository.findBySessionCode(sessionCode);
        if (sessionOpt.isEmpty()) {
            throw new UnauthorizedAccessException("Session not found");
        }
        
        Session session = sessionOpt.get();
        if (!session.getId().equals(user.getSession().getId())) {
            throw new UnauthorizedAccessException("User does not belong to this session");
        }
    }
    
    /**
     * Get the authenticated user ID from the current request.
     * 
     * @return User ID from JWT token
     */
    public Long getAuthenticatedUserId() {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
    
    /**
     * Get the session code from the authenticated user's JWT token.
     * 
     * @return Session code from JWT token
     */
    public String getAuthenticatedSessionCode() {
        String sessionCode = (String) request.getAttribute("sessionCode");
        if (sessionCode == null) {
            throw new UnauthorizedAccessException("Session code not found in token");
        }
        return sessionCode;
    }
    
    /**
     * Get the user role from the authenticated user's JWT token.
     * 
     * @return UserRole from JWT token
     */
    public UserRole getAuthenticatedUserRole() {
        UserRole role = (UserRole) request.getAttribute("role");
        if (role == null) {
            throw new UnauthorizedAccessException("Role not found in token");
        }
        return role;
    }
    
    /**
     * Check if the authenticated user is a moderator.
     *
     * @return true if user has MODERATOR role
     */
    public boolean isAuthenticatedUserModerator() {
        UserRole role = getAuthenticatedUserRole();
        return role == UserRole.MODERATOR;
    }

    // ── Ownership guards ────────────────────────────────────────────────────────

    /**
     * Ensures a Story belongs to the given Session.
     *
     * @throws SessionMembershipException if the story is not part of the session
     */
    public void requireStoryBelongsToSession(Story story, Session session) {
        if (!story.getSession().getId().equals(session.getId())) {
            throw new SessionMembershipException(
                    "Story " + story.getId() + " does not belong to session " + session.getSessionCode());
        }
    }

    /**
     * Ensures a User belongs to the given Session.
     *
     * @throws SessionMembershipException if the user is not part of the session
     */
    public void requireUserBelongsToSession(User user, Session session) {
        if (!user.getSession().getId().equals(session.getId())) {
            throw new SessionMembershipException(
                    "User " + user.getId() + " does not belong to session " + session.getSessionCode());
        }
    }

    /**
     * Returns {@code true} when the authenticated caller either has the MODERATOR role
     * or has the same user ID as {@code targetUserId}.
     *
     * <p>Intended for use with {@code @PreAuthorize}:
     * <pre>@PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")</pre>
     */
    public boolean isCallerOrModerator(Long targetUserId) {
        if (isAuthenticatedUserModerator()) {
            return true;
        }
        Long callerId = getAuthenticatedUserId();
        return callerId.equals(targetUserId);
    }
}
