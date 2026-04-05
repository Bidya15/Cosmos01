package com.cosmos.config;

import com.cosmos.websocket.CosmosHandshakeHandler;
import com.cosmos.websocket.CosmosHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${cosmos.websocket.allowed-origins}")
    private String allowedOrigins;

    private final CosmosHandshakeInterceptor handshakeInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .addInterceptors(handshakeInterceptor)
                .setHandshakeHandler(new CosmosHandshakeHandler())
                .withSockJS();
        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns(origins)
                .addInterceptors(handshakeInterceptor)
                .setHandshakeHandler(new CosmosHandshakeHandler());
    }
}
