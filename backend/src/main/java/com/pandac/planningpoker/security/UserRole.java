package com.pandac.planningpoker.security;

/**
 * Enumeration of user roles in the Planning Poker application.
 * Each role has a corresponding Spring Security authority string.
 */
public enum UserRole {
    /**
     * Session moderator - can create, modify, and delete sessions and stories.
     * Can reveal votes, finalize estimates, and access analytics.
     */
    MODERATOR("ROLE_MODERATOR"),
    
    /**
     * Regular participant - can join sessions and cast votes.
     * Cannot modify session settings or reveal votes.
     */
    PARTICIPANT("ROLE_PARTICIPANT"),
    
    /**
     * Observer - can view session but cannot vote.
     * Read-only access to session information.
     */
    OBSERVER("ROLE_OBSERVER");
    
    private final String authority;
    
    UserRole(String authority) {
        this.authority = authority;
    }
    
    /**
     * Get the Spring Security authority string for this role.
     * @return Authority string (e.g., "ROLE_MODERATOR")
     */
    public String getAuthority() {
        return authority;
    }
    
    /**
     * Get the simple role name without the "ROLE_" prefix.
     * @return Role name (e.g., "MODERATOR")
     */
    public String getRoleName() {
        return this.name();
    }
    
    /**
     * Parse a role string to UserRole enum.
     * @param role The role string (case-insensitive)
     * @return UserRole enum value
     * @throws IllegalArgumentException if role is invalid
     */
    public static UserRole fromString(String role) {
        if (role == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        
        String normalized = role.toUpperCase().replace("ROLE_", "");
        try {
            return UserRole.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role + ". Valid roles are: MODERATOR, PARTICIPANT, OBSERVER");
        }
    }
    
    /**
     * Check if the given role string is valid.
     * @param role The role string to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValid(String role) {
        try {
            fromString(role);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
