package com.pandac.planningpoker.repository;

import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findBySessionAndIsActive(Session session, Boolean isActive);
    Optional<User> findByNameAndSession(String name, Session session);
    List<User> findBySessionAndIsActiveAndIsObserver(Session session, Boolean isActive, Boolean isObserver);
    List<User> findBySession(Session session);
}
