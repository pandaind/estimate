package com.pandac.planningpoker.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Settings that belong to a Session, persisted as columns in the sessions table.
 * Using @Embeddable means adding a new setting is a one-field change in one class.
 */
@Embeddable
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
