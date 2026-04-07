package com.cosmos.repository;

import com.cosmos.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findByRoomIdOrderBySentAtAsc(String roomId);

    List<ChatMessage> findTop50ByRoomIdOrderBySentAtDesc(String roomId);

    // Fetch the absolute most recent messages globally for new joiners
    List<ChatMessage> findTop20ByIsGlobalTrueOrderBySentAtDesc();

    // Fetch the most recent messages for a specific room (proximity or space)
    List<ChatMessage> findTop20ByRoomIdOrderBySentAtDesc(String roomId);
}
