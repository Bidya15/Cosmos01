package com.cosmos.service;

import com.cosmos.dto.CosmosMessages.*;
import com.cosmos.model.ChatMessage;
import com.cosmos.model.Space;
import com.cosmos.model.UserSession;
import com.cosmos.repository.ChatMessageRepository;
import com.cosmos.repository.SpaceRepository;
import com.cosmos.repository.UserSessionRepository;
import com.cosmos.utils.CosmosUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static com.cosmos.utils.CosmosUtils.*;

/**
 * Core business service for the Cosmos platform.
 * Orchestrates user entrance, real-time spatial movement, and proximity-driven interaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CosmosService {

    private final UserStateStore userStateStore;
    private final UserSessionRepository userSessionRepository;
    private final SpaceRepository spaceRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${cosmos.world.width:2400}")
    private int worldWidth;

    @Value("${cosmos.world.height:1800}")
    private int worldHeight;

    // ========== JOIN / ENTRANCE ==========

    /**
     * Processes a new user's entrance into a virtual space.
     * Synchronizes state with database and notifies existing users.
     */
    @Transactional
    public void handleJoin(JoinPayload payload, String sessionId) {
        String spaceId = payload.getSpaceId();
        if (spaceId == null || spaceId.isBlank()) spaceId = "default";
        
        log.info("[Join] User '{}' (id={}) entering space '{}'", payload.getUsername(), payload.getId(), spaceId);

        // Fetch space bounds
        int width = worldWidth;
        int height = worldHeight;
        Optional<Space> spaceOpt = spaceRepository.findById(spaceId);
        if (spaceOpt.isPresent()) {
            width = spaceOpt.get().getWidth();
            height = spaceOpt.get().getHeight();
        }

        // Clamp position to world bounds
        double x = clamp(payload.getX(), 24, width - 24);
        double y = clamp(payload.getY(), 24, height - 24);

        UserDTO userDto = UserDTO.builder()
                .id(payload.getId())
                .username(sanitize(payload.getUsername()))
                .color(payload.getColor())
                .x(x)
                .y(y)
                .build();

        // Register in-memory
        userStateStore.addUser(userDto, spaceId, sessionId);

        // Persistence: Sync session state to database
        final String finalSpaceId = spaceId;
        UserSession session = userSessionRepository.findById(payload.getId()).map(existing -> {
            existing.setUsername(sanitize(payload.getUsername()));
            existing.setColor(payload.getColor());
            existing.setSpaceId(finalSpaceId);
            existing.setX(x);
            existing.setY(y);
            existing.setSessionId(sessionId);
            existing.setOnline(true);
            existing.setLastSeenAt(Instant.now());
            return existing;
        }).orElseGet(() -> UserSession.builder()
                .userId(payload.getId())
                .spaceId(finalSpaceId)
                .username(sanitize(payload.getUsername()))
                .color(payload.getColor())
                .x(x)
                .y(y)
                .sessionId(sessionId)
                .online(true)
                .joinedAt(Instant.now())
                .lastSeenAt(Instant.now())
                .build());
        
        userSessionRepository.save(session);

        // Provide joining user with current room environment
        List<UserDTO> existingUsers = userStateStore.getOtherUsersInSpace(payload.getId(), spaceId);
        messagingTemplate.convertAndSendToUser(
                sessionId,
                "/queue/room-state",
                RoomStatePayload.builder().users(existingUsers).build()
        );

        // Broadcast presence to the local space topic
        messagingTemplate.convertAndSend(
                "/topic/cosmos/" + spaceId,
                wrapEvent("USER_JOINED", userDto)
        );

        log.info("[Join] Successfully established session {} for {}.", sessionId, payload.getId());
    }

    // ========== MOVE / SYNC ==========

    /**
     * Updates user coordinates and recalculates the proximity graph.
     * Enforces world boundaries and broadcasts updates at a regular cadence.
     */
    public void handleMove(String userId, MovePayload payload) {
        if (!userStateStore.isUserActive(userId)) return;

        double x = clamp(payload.getX(), 0, worldWidth);
        double y = clamp(payload.getY(), 0, worldHeight);

        userStateStore.updatePosition(userId, x, y);

        String spaceId = userStateStore.getUserSpace(userId).orElse("default");

        // Real-time broadcast
        messagingTemplate.convertAndSend(
                "/topic/cosmos/" + spaceId,
                wrapEvent("POSITION_UPDATE", PositionUpdatePayload.builder()
                        .userId(userId)
                        .x(x)
                        .y(y)
                        .build())
        );

        // Compute Proximity Graph: Detect range changes on every move
        Map<String, List<String>> changes = userStateStore.computeProximityChanges(userId);
        List<String> entered = changes.get("entered");
        List<String> left = changes.get("left");

        // Fire proximity notifications to involved parties
        for (String otherId : entered) notifyProximity(userId, otherId, "enter");
        for (String otherId : left) notifyProximity(userId, otherId, "leave");

        // Fire database update for position recovery
        userSessionRepository.updatePosition(userId, x, y, Instant.now());
    }

    // ========== CHAT / INTERACTION ==========

    /**
     * Delivers real-time chat messages between users.
     * ⚠️ SECURITY: Message delivery is blocked if the users are not within proximity range.
     */
    @Transactional
    public void handleChat(String fromUserId, ChatPayload payload) {
        if (!userStateStore.isUserActive(fromUserId) || payload.getMessage() == null) return;

        String safeMessage = sanitize(payload.getMessage());
        if (safeMessage.length() > 500) safeMessage = safeMessage.substring(0, 500);

        UserDTO sender = userStateStore.getUser(fromUserId).orElse(null);
        if (sender == null) return;

        // --- ENFORCE PROXIMITY LOCK ---
        if (!userStateStore.getConnections(fromUserId).contains(payload.getToUserId())) {
            log.warn("[Chat System] Refused delivery: Users not in proximity range.");
            return;
        }

        String roomId = computeRoomId(fromUserId, payload.getToUserId());

        // Log to DB for historical analytics
        ChatMessage chatMessage = ChatMessage.builder()
                .roomId(roomId)
                .senderId(fromUserId)
                .senderUsername(sender.getUsername())
                .message(safeMessage)
                .sentAt(Instant.now())
                .build();
        chatMessageRepository.save(chatMessage);

        ChatReceivedPayload outbound = ChatReceivedPayload.builder()
                .fromUserId(fromUserId)
                .fromUsername(sender.getUsername())
                .roomId(roomId)
                .message(safeMessage)
                .timestamp(payload.getTimestamp())
                .build();

        // Deliver directly to the recipient's personal WebSocket queue
        userStateStore.getSessionId(payload.getToUserId()).ifPresent(toSession ->
                messagingTemplate.convertAndSendToUser(
                        toSession,
                        "/queue/chat",
                        wrapEvent("CHAT_RECEIVED", outbound)
                )
        );
    }

    // ========== LEAVE / EXIT ==========

    /**
     * Gracefully cleans up user state and notifies the environment of departure.
     */
    @Transactional
    public void handleLeave(String sessionId) {
        userStateStore.getUserIdBySession(sessionId).ifPresent(userId -> {
            log.info("[Leave] Session termination for {}", userId);
            String spaceId = userStateStore.getUserSpace(userId).orElse("default");

            userStateStore.removeUser(userId);

            messagingTemplate.convertAndSend(
                    "/topic/cosmos/" + spaceId,
                    wrapEvent("USER_LEFT", UserLeftPayload.builder().userId(userId).build())
            );

            userSessionRepository.markOffline(userId, Instant.now());
        });
    }

    // ========== API SUPPORT ==========

    public List<UserDTO> getOnlineUsers() {
        return userStateStore.getAllUsers();
    }

    public List<SpaceDTO> getAvailableSpaces() {
        return spaceRepository.findAll().stream().map(s -> SpaceDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .userCount(userStateStore.getUsersInSpace(s.getId()).size())
                .build()).collect(java.util.stream.Collectors.toList());
    }

    // ========== PRIVATE HELPERS ==========

    private void notifyProximity(String userId, String otherId, String type) {
        final String eventType = "PROXIMITY_" + type.toUpperCase();
        
        // Notify both users of the relationship change
        userStateStore.getSessionId(userId).ifPresent(sess ->
                messagingTemplate.convertAndSendToUser(sess, "/queue/proximity",
                        wrapEvent(eventType, ProximityPayload.builder().userId(otherId).type(type).build())));
        
        userStateStore.getSessionId(otherId).ifPresent(sess ->
                messagingTemplate.convertAndSendToUser(sess, "/queue/proximity",
                        wrapEvent(eventType, ProximityPayload.builder().userId(userId).type(type).build())));
    }
}
