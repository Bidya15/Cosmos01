package com.cosmos.controller;

import com.cosmos.dto.CosmosMessages.*;
import com.cosmos.service.CosmosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cosmos")
@CrossOrigin(originPatterns = "${cosmos.websocket.allowed-origins}")
@RequiredArgsConstructor
public class CosmosController {

    private final CosmosService cosmosService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getOnlineUsers() {
        return ResponseEntity.ok(cosmosService.getOnlineUsers());
    }

    /**
     * GET /api/cosmos/spaces
     * Returns list of available virtual spaces (offices)
     */
    @GetMapping("/spaces")
    public ResponseEntity<List<SpaceDTO>> getSpaces() {
        return ResponseEntity.ok(cosmosService.getAvailableSpaces());
    }

    /**
     * GET /api/cosmos/health
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        List<UserDTO> users = cosmosService.getOnlineUsers();
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Cosmos Backend",
                "onlineUsers", users.size()
        ));
    }
}
