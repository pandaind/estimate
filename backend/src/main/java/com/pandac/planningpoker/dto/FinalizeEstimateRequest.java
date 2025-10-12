package com.pandac.planningpoker.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizeEstimateRequest {
    
    @NotBlank(message = "Final estimate is required")
    private String finalEstimate;
    
    private String notes;
}
