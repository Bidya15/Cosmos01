package com.cosmos.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_room_id", columnList = "roomId"),
    @Index(name = "idx_sender_id", columnList = "senderId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String roomId;

    @Column(nullable = false)
    private String senderId;

    @Column(nullable = false)
    private String senderUsername;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column
    private String senderColor; // For persistent visual identity in history

    @Builder.Default
    @Column(nullable = false)
    private boolean isGlobal = false;

    @Column(nullable = false)
    private Instant sentAt;

    @PrePersist
    public void prePersist() {
        if (sentAt == null) sentAt = Instant.now();
    }
}
