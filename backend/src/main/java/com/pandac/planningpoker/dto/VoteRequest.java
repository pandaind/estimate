package com.pandac.planningpoker.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotBlank(message = "Estimate is required")
    private String estimate;
    
    @Min(value = 1, message = "Confidence must be between 1 and 5")
    @Max(value = 5, message = "Confidence must be between 1 and 5")
    private Integer confidence;
}
