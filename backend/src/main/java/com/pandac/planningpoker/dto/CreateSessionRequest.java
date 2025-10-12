package com.pandac.planningpoker.dto;

import com.pandac.planningpoker.model.SizingMethod;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {
    
    @NotBlank(message = "Session name is required")
    @Size(min = 3, max = 100, message = "Session name must be between 3 and 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Sizing method is required")
    private SizingMethod sizingMethod;
    
    private String[] customValues; // Only used when sizingMethod is CUSTOM
    
    @NotBlank(message = "Moderator name is required")
    @Size(min = 1, max = 50, message = "Moderator name must be between 1 and 50 characters")
    private String moderatorName;
    
    private String moderatorAvatar;
    
    private Boolean moderatorCanVote = false;
    
    private SessionSettings settings;
}
