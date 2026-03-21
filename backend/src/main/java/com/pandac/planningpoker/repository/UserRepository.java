package com.pandac.planningpoker.repository;

import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.model.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findBySessionAndActive(Session session, boolean active);
    Page<User> findBySessionAndActive(Session session, boolean active, Pageable pageable);
    Optional<User> findByNameAndSession(String name, Session session);
    List<User> findBySessionAndActiveAndObserver(Session session, boolean active, boolean observer);
    List<User> findBySession(Session session);
    Page<User> findBySession(Session session, Pageable pageable);
}
