package com.pandac.planningpoker.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinSessionRequest {
    
    @NotBlank(message = "User name is required")
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters")
    private String name;
    
    private String avatar;
    
    private Boolean isObserver = false;
}
