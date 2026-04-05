package com.cosmos.websocket;

import com.cosmos.dto.CosmosMessages.*;
import com.cosmos.service.CosmosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CosmosWebSocketController {

    private final CosmosService cosmosService;

    /**
     * Client sends: /app/cosmos/join
     * Payload: { id, username, color, x, y }
     */
    @MessageMapping("/cosmos/join")
    public void handleJoin(@Payload JoinPayload payload,
                           SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userId", payload.getId());
        }
        cosmosService.handleJoin(payload, sessionId);
    }

    /**
     * Client sends: /app/cosmos/move
     * Payload: { x, y }
     * Header must include userId
     */
    @MessageMapping("/cosmos/move")
    public void handleMove(@Payload MovePayload payload,
                           SimpMessageHeaderAccessor headerAccessor) {
        String userId = getUserId(headerAccessor);
        if (userId != null) {
            cosmosService.handleMove(userId, payload);
        }
    }

    /**
     * Client sends: /app/cosmos/chat
     * Payload: { roomId, toUserId, message, timestamp }
     */
    @MessageMapping("/cosmos/chat")
    public void handleChat(@Payload ChatPayload payload,
                           SimpMessageHeaderAccessor headerAccessor) {
        String userId = getUserId(headerAccessor);
        if (userId != null) {
            cosmosService.handleChat(userId, payload);
        }
    }

    /**
     * Client sends: /app/cosmos/leave
     */
    @MessageMapping("/cosmos/leave")
    public void handleLeave(SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        cosmosService.handleLeave(sessionId);
    }

    /**
     * Handles WebSocket disconnection events (browser close, network loss, etc.)
     */
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        log.debug("[Disconnect] Session: {}", sessionId);
        cosmosService.handleLeave(sessionId);
    }

    // ========== Helpers ==========

    private String getUserId(SimpMessageHeaderAccessor accessor) {
        Object userId = accessor.getSessionAttributes() != null
                ? accessor.getSessionAttributes().get("userId")
                : null;
        if (userId == null) {
            log.warn("[WS] Message received without userId in session");
        }
        return userId != null ? userId.toString() : null;
    }
}
