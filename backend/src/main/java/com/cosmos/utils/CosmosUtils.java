package com.cosmos.utils;

import java.util.Arrays;
import java.util.Map;

/**
 * General purpose utilities for the Cosmos platform.
 * Contains coordinate clamping, input sanitization, and room ID computation.
 */
public class CosmosUtils {

    /**
     * Clamps a value within the specified range [min, max].
     */
    public static double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Sanitizes strings to prevent XSS or injection in the virtual space.
     * Removes potentially dangerous HTML characters.
     */
    public static String sanitize(String input) {
        if (input == null) return "Unknown";
        // Simple regex to strip HTML-like characters
        return input.replaceAll("[<>&\"']", "").trim();
    }

    /**
     * Computes a deterministic room ID for a pair of users.
     * Sorts the IDs to ensure UserA -> UserB uses the same room as UserB -> UserA.
     */
    public static String computeRoomId(String uid1, String uid2) {
        String[] ids = {uid1, uid2};
        Arrays.sort(ids);
        return ids[0] + "__" + ids[1];
    }

    /**
     * Wraps a payload in a standard event envelope for WebSocket transmission.
     */
    public static Map<String, Object> wrapEvent(String type, Object payload) {
        return Map.of("type", type, "payload", payload);
    }
}
