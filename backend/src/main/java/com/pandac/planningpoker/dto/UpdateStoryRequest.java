package com.pandac.planningpoker.dto;

import com.pandac.planningpoker.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStoryRequest {
    
    @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
    private String title;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @Size(max = 2000, message = "Acceptance criteria must not exceed 2000 characters")
    private String acceptanceCriteria;
    
    private List<String> tags;
    
    private Priority priority;
}
