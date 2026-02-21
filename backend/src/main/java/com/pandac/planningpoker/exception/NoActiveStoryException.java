package com.pandac.planningpoker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a voting-related operation is attempted but there is no active story
 * set for the session (i.e. currentStoryId is null).
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class NoActiveStoryException extends RuntimeException {
    public NoActiveStoryException(String message) {
        super(message);
    }
}
