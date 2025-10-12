package com.pandac.planningpoker.model;

public enum SizingMethod {
    FIBONACCI("Fibonacci", new String[]{"1", "2", "3", "5", "8", "13", "21", "∞", "?", "☕"}),
    T_SHIRT("T-Shirt Sizes", new String[]{"XS", "S", "M", "L", "XL", "XXL", "∞", "?", "☕"}),
    POWERS_OF_2("Powers of 2", new String[]{"1", "2", "4", "8", "16", "32", "64", "∞", "?", "☕"}),
    LINEAR("Linear Scale", new String[]{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "∞", "?", "☕"}),
    CUSTOM("Custom", new String[]{});

    private final String displayName;
    private final String[] defaultValues;

    SizingMethod(String displayName, String[] defaultValues) {
        this.displayName = displayName;
        this.defaultValues = defaultValues;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String[] getDefaultValues() {
        return defaultValues;
    }
}
