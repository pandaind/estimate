package com.pandac.planningpoker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a resource (Story, Vote, User) does not belong to the expected Session.
 * Maps to HTTP 403 Forbidden.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class SessionMembershipException extends RuntimeException {
    public SessionMembershipException(String message) {
        super(message);
    }
}
