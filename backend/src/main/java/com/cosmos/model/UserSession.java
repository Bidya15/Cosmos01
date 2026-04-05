package com.cosmos.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "user_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @Column(nullable = false, unique = true)
    private String userId;

    @Column(nullable = false)
    private String spaceId; // Which "cosmos" the user is in

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    @Column
    private String sessionId; // WebSocket session ID

    @Column(nullable = false)
    private boolean online;

    @Column(nullable = false)
    private Instant joinedAt;

    @Column
    private Instant lastSeenAt;

    @Column
    private long totalOnlineSeconds;

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = Instant.now();
        if (lastSeenAt == null) lastSeenAt = Instant.now();
    }
}
