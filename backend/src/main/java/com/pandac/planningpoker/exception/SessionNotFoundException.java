package com.pandac.planningpoker.exception;

public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException(String sessionCode) {
        super("Session not found: " + sessionCode);
    }
}
