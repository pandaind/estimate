package com.pandac.planningpoker.exception;

public class StoryNotFoundException extends RuntimeException {
    public StoryNotFoundException(Long storyId) {
        super("Story not found: " + storyId);
    }
}
