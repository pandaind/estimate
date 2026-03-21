package com.pandac.planningpoker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.pandac.planningpoker.model.converter.StringListConverter;

@Entity
@Table(name = "sessions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"stories", "users"})
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Version
    private Long version;
    
    @Column(unique = true, nullable = false)
    private String sessionCode;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SizingMethod sizingMethod;
    
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> customValues = Collections.emptyList(); // JSON array for custom sizing method
    
    private Long moderatorId;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Story> stories = new ArrayList<>();
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> users = new ArrayList<>();
    
    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
    
    private Long currentStoryId;
    
    @Column(nullable = false)
    private boolean votesRevealed = false;
    
    // Session Settings (embedded — add new settings fields only in SessionSettings.java)
    @Embedded
    private SessionSettings settings = new SessionSettings();

    @Column(nullable = false)
    private boolean moderatorCanVote = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
