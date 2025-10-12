package com.pandac.planningpoker.repository;

import com.pandac.planningpoker.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findBySessionCodeAndIsActive(String sessionCode, Boolean isActive);
    Optional<Session> findBySessionCode(String sessionCode);
}
