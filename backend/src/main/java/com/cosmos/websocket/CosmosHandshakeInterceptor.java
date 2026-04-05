package com.cosmos.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Extracts userId from query params during WebSocket handshake
 * so it's available in session attributes for all subsequent messages.
 */
@Component
@Slf4j
public class CosmosHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String query = request.getURI().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] kv = param.split("=");
                if (kv.length == 2 && kv[0].equals("userId")) {
                    attributes.put("userId", kv[1]);
                    log.debug("[Handshake] userId={} registered in session", kv[1]);
                }
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                                ServerHttpResponse response,
                                WebSocketHandler wsHandler,
                                Exception exception) {}
}
