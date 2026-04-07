package com.cosmos.utils;

import java.util.Arrays;
import java.util.Map;


public class CosmosUtils {


    public static double clamp(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    public static String sanitize(String input) {
        if (input == null) return "Unknown";
        // Simple regex to strip HTML-like characters
        return input.replaceAll("[<>&\"']", "").trim();
    }


    public static String computeRoomId(String uid1, String uid2) {
        String[] ids = {uid1, uid2};
        Arrays.sort(ids);
        return ids[0] + "__" + ids[1];
    }


    public static Map<String, Object> wrapEvent(String type, Object payload) {
        return Map.of("type", type, "payload", payload);
    }
}
