package com.pandac.planningpoker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    private String avatar;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private Session session;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean isObserver = false;
    
    @Column(nullable = false)
    private Boolean isModerator = false;
    
    @Column(nullable = false)
    private LocalDateTime joinedAt;
    
    private LocalDateTime lastSeenAt;
    
    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        lastSeenAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastSeenAt = LocalDateTime.now();
    }
}
