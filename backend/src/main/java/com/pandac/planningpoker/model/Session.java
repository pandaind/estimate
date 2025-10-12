package com.pandac.planningpoker.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String sessionCode;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SizingMethod sizingMethod;
    
    @Column(columnDefinition = "TEXT")
    private String customValues; // JSON array for custom sizing method
    
    private Long moderatorId;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Story> stories = new ArrayList<>();
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> users = new ArrayList<>();
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    private Long currentStoryId;
    
    @Column(nullable = false)
    private Boolean votesRevealed = false;
    
    // Session Settings
    @Column(nullable = false)
    private Boolean autoReveal = false;
    
    @Column(nullable = false)
    private Boolean timerEnabled = false;
    
    private Integer timerDuration = 300;
    
    @Column(nullable = false)
    private Boolean allowChangeVote = true;
    
    @Column(nullable = false)
    private Boolean allowObservers = true;
    
    @Column(nullable = false)
    private Boolean requireConfidence = false;
    
    @Column(nullable = false)
    private Boolean moderatorCanVote = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
