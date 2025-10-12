package com.pandac.planningpoker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters")
    private String name;
    
    private String avatar;
}
