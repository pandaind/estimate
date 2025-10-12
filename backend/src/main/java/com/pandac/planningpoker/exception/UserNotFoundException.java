package com.pandac.planningpoker.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String userName) {
        super("User not found: " + userName);
    }
    
    public UserNotFoundException(Long userId) {
        super("User not found with ID: " + userId);
    }
}
