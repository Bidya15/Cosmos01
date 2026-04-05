package com.cosmos.controller;

import com.cosmos.dto.CosmosMessages.*;
import com.cosmos.model.User;
import com.cosmos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already registered");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already taken");
        }

        String[] colors = {"#3b82f6", "#06b6d4", "#818cf8", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#f97316", "#14b8a6", "#e879f9"};
        String randomColor = colors[new java.util.Random().nextInt(colors.length)];

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .color(randomColor)
                .build();

        userRepository.save(user);
        log.info("[Auth] Registered new user: {}", user.getUsername());

        return ResponseEntity.ok(AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .color(user.getColor())
                .token(UUID.randomUUID().toString())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
                .map(user -> ResponseEntity.ok(AuthResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .color(user.getColor())
                        .token(UUID.randomUUID().toString())
                        .build()))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    log.info("[Auth] Password reset requested for: {}", user.getEmail());
                    return ResponseEntity.ok("Signal recovery initiated. (Simulated email sent)");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Signal ID not found."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                    userRepository.save(user);
                    log.info("[Auth] Password reset successful for: {}", user.getEmail());
                    return ResponseEntity.ok("Signal protocol updated. You may now establish a link.");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}