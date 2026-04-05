package com.cosmos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// ===== Inbound DTOs (Client → Server) =====

public class CosmosMessages {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ForgotPasswordRequest {
        private String email;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResetPasswordRequest {
        private String email;
        private String newPassword;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String id;
        private String username;
        private String email;
        private String color;
        private String token; // simple session token
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JoinPayload {
        private String id;
        private String spaceId; // target space to join
        private String username;
        private String color;
        private double x;
        private double y;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MovePayload {
        private double x;
        private double y;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChatPayload {
        private String roomId;
        private String toUserId;
        private String message;
        private long timestamp;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LeavePayload {
        private String userId;
    }

    // ===== Outbound DTOs (Server → Client) =====

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserDTO {
        private String id;
        private String username;
        private String color;
        private double x;
        private double y;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoomStatePayload {
        private List<UserDTO> users;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PositionUpdatePayload {
        private String userId;
        private double x;
        private double y;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserLeftPayload {
        private String userId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChatReceivedPayload {
        private String fromUserId;
        private String fromUsername;
        private String roomId;
        private String message;
        private long timestamp;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ErrorPayload {
        private String code;
        private String message;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProximityPayload {
        private String userId;
        private String type; // "enter" or "leave"
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SpaceDTO {
        private String id;
        private String name;
        private String description;
        private int userCount;
    }
}
