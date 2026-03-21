package com.pandac.planningpoker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"session"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    private String avatar;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private Session session;
    
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
    
    @Column(name = "is_observer", nullable = false)
    private boolean observer = false;
    
    @Column(name = "is_moderator", nullable = false)
    private boolean moderator = false;
    
    @Column(nullable = false)
    private OffsetDateTime joinedAt;

    private OffsetDateTime lastSeenAt;
    @PrePersist
    protected void onCreate() {
        joinedAt = OffsetDateTime.now();
        lastSeenAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastSeenAt = OffsetDateTime.now();
    }
}
