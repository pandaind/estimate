package com.pandac.planningpoker.model;

public enum StoryStatus {
    NOT_ESTIMATED("Not Estimated"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed"),
    SKIPPED("Skipped");

    private final String displayName;

    StoryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
