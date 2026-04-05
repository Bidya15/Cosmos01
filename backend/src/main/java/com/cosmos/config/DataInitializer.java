package com.cosmos.config;

import com.cosmos.model.Space;
import com.cosmos.repository.SpaceRepository;
import com.cosmos.repository.UserRepository;
import com.cosmos.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SpaceRepository spaceRepository;
    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        // 1. Seed Spaces
        if (spaceRepository.count() == 0) {
            log.info("[Data] Seeding initial spaces...");
            spaceRepository.saveAll(List.of(
                Space.builder()
                    .id("main-office")
                    .name("Main Office Hub")
                    .description("The central gathering place for the community.")
                    .width(2400)
                    .height(1800)
                    .build(),
                Space.builder()
                    .id("engineering")
                    .name("Engineering Studio")
                    .description("Deep focus zone for building the future.")
                    .width(2000)
                    .height(1600)
                    .build(),
                Space.builder()
                    .id("cafeteria")
                    .name("The Stardust Cafe")
                    .description("Relax and chat with fellow cosmic travelers.")
                    .width(1800)
                    .height(1400)
                    .build()
            ));
        }

        // Dummy user seeding has been removed.
        // Users can now register themselves via the AuthScreen.
    }
}
