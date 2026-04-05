package com.cosmos.service;

import com.cosmos.dto.CosmosMessages.UserDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Fast in-memory store for active user state.
 * Separate from DB to avoid latency on every position update.
 * The DB is used for persistence/analytics only.
 */
@Component
public class UserStateStore {

    @Value("${cosmos.proximity.radius:150.0}")
    private double proximityRadius;

    // userId -> UserDTO (live positions)
    private final Map<String, UserDTO> activeUsers = new ConcurrentHashMap<>();

    // userId -> sessionId (WebSocket session)
    private final Map<String, String> userSessions = new ConcurrentHashMap<>();

    // sessionId -> userId (reverse lookup for disconnect)
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();

    // userId -> spaceId
    private final Map<String, String> userToSpace = new ConcurrentHashMap<>();

    // spaceId -> Set<userId> (fast lookup for users in space)
    private final Map<String, Set<String>> spaceToUsers = new ConcurrentHashMap<>();

    // userId -> Set<userId> (active proximity connections)
    private final Map<String, Set<String>> connections = new ConcurrentHashMap<>();

    public void addUser(UserDTO user, String spaceId, String sessionId) {
        activeUsers.put(user.getId(), user);
        userSessions.put(user.getId(), sessionId);
        sessionToUser.put(sessionId, user.getId());
        userToSpace.put(user.getId(), spaceId);
        spaceToUsers.computeIfAbsent(spaceId, k -> ConcurrentHashMap.newKeySet()).add(user.getId());
        connections.put(user.getId(), ConcurrentHashMap.newKeySet());
    }

    public void removeUser(String userId) {
        String sessionId = userSessions.remove(userId);
        if (sessionId != null) sessionToUser.remove(sessionId);
        
        String spaceId = userToSpace.remove(userId);
        if (spaceId != null) {
            Set<String> usersInSpace = spaceToUsers.get(spaceId);
            if (usersInSpace != null) usersInSpace.remove(userId);
        }

        activeUsers.remove(userId);
        connections.remove(userId);
        // Remove from other users' connection sets
        connections.values().forEach(set -> set.remove(userId));
    }

    public Optional<String> getUserIdBySession(String sessionId) {
        return Optional.ofNullable(sessionToUser.get(sessionId));
    }

    public void updatePosition(String userId, double x, double y) {
        activeUsers.computeIfPresent(userId, (id, user) -> {
            user.setX(x);
            user.setY(y);
            return user;
        });
    }

    public List<UserDTO> getAllUsers() {
        return new ArrayList<>(activeUsers.values());
    }

    public List<UserDTO> getUsersInSpace(String spaceId) {
        Set<String> userIds = spaceToUsers.getOrDefault(spaceId, Collections.emptySet());
        return userIds.stream()
                .map(activeUsers::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getOtherUsersInSpace(String userId, String spaceId) {
        Set<String> userIds = spaceToUsers.getOrDefault(spaceId, Collections.emptySet());
        return userIds.stream()
                .filter(id -> !id.equals(userId))
                .map(activeUsers::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> getUser(String userId) {
        return Optional.ofNullable(activeUsers.get(userId));
    }

    public Optional<String> getSessionId(String userId) {
        return Optional.ofNullable(userSessions.get(userId));
    }

    public Optional<String> getUserSpace(String userId) {
        return Optional.ofNullable(userToSpace.get(userId));
    }

    public int getActiveCount() {
        return activeUsers.size();
    }

    public boolean isUserActive(String userId) {
        return activeUsers.containsKey(userId);
    }

    /**
     * Compute which users entered/left proximity for a given user.
     * Returns a map with "entered" and "left" lists.
     */
    public Map<String, List<String>> computeProximityChanges(String userId) {
        UserDTO user = activeUsers.get(userId);
        if (user == null) return Map.of("entered", List.of(), "left", List.of());

        Set<String> currentConnections = connections.getOrDefault(userId, Set.of());
        List<String> entered = new ArrayList<>();
        List<String> left = new ArrayList<>();

        String spaceId = userToSpace.get(userId);
        if (spaceId == null) return Map.of("entered", List.of(), "left", List.of());

        Set<String> usersInSpace = spaceToUsers.getOrDefault(spaceId, Collections.emptySet());

        for (String otherId : usersInSpace) {
            if (otherId.equals(userId)) continue;
            UserDTO other = activeUsers.get(otherId);
            if (other == null) continue;
            
            boolean inRange = distance(user, other) < proximityRadius;
            boolean wasConnected = currentConnections.contains(other.getId());

            if (inRange && !wasConnected) {
                entered.add(other.getId());
            } else if (!inRange && wasConnected) {
                left.add(other.getId());
            }
        }

        // Update connection sets
        Set<String> userConns = connections.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        entered.forEach(id -> {
            userConns.add(id);
            connections.computeIfAbsent(id, k -> ConcurrentHashMap.newKeySet()).add(userId);
        });
        left.forEach(id -> {
            userConns.remove(id);
            Set<String> otherConns = connections.get(id);
            if (otherConns != null) otherConns.remove(userId);
        });

        return Map.of("entered", entered, "left", left);
    }

    public Set<String> getConnections(String userId) {
        return connections.getOrDefault(userId, Set.of());
    }

    private double distance(UserDTO a, UserDTO b) {
        double dx = a.getX() - b.getX();
        double dy = a.getY() - b.getY();
        return Math.sqrt(dx * dx + dy * dy);
    }
}
