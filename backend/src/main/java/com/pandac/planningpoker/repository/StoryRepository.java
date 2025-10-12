package com.pandac.planningpoker.repository;

import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.StoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findBySessionOrderByOrderIndex(Session session);
    List<Story> findBySessionAndStatusOrderByOrderIndex(Session session, StoryStatus status);
}
