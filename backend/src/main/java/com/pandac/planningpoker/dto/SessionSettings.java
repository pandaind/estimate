package com.pandac.planningpoker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionSettings {
    private Boolean autoReveal = false;
    private Boolean timerEnabled = false;
    private Integer timerDuration = 300; // seconds
    private Boolean allowChangeVote = true;
    private Boolean allowObservers = true;
    private Boolean requireConfidence = false;
}
