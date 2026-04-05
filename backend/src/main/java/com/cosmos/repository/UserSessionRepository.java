package com.cosmos.repository;

import com.cosmos.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    List<UserSession> findByOnlineTrue();

    Optional<UserSession> findBySessionId(String sessionId);

    @Modifying
    @Transactional
    @Query("UPDATE UserSession u SET u.online = false, u.lastSeenAt = :now WHERE u.userId = :userId")
    void markOffline(@Param("userId") String userId, @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE UserSession u SET u.x = :x, u.y = :y, u.lastSeenAt = :now WHERE u.userId = :userId")
    void updatePosition(@Param("userId") String userId,
                        @Param("x") double x,
                        @Param("y") double y,
                        @Param("now") Instant now);
}
