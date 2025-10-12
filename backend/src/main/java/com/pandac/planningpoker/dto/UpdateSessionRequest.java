package com.pandac.planningpoker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSessionRequest {
    private String name;
    private String description;
    private SessionSettings settings;
}
