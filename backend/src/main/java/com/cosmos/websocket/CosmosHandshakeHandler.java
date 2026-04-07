package com.cosmos.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;


public class CosmosHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(@NonNull ServerHttpRequest request,
                                      @NonNull WebSocketHandler wsHandler,
                                      @NonNull Map<String, Object> attributes) {
        // Generate a unique Principal name for this session.
        // We use a combination of UUID and any existing userId attribute to ensure stability.
        String principalId = (String) attributes.get("userId");
        if (principalId == null) {
            principalId = UUID.randomUUID().toString();
        }
        
        // We append a random suffix to ensure that multiple tabs for the SAME user
        // get unique Principals, allowing us to target them individually if needed.
        final String finalName = principalId + "_" + UUID.randomUUID().toString().substring(0, 8);
        
        return new Principal() {
            @Override
            public String getName() {
                return finalName;
            }
        };
    }
}
