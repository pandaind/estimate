package com.pandac.planningpoker.repository;

import com.pandac.planningpoker.model.Vote;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByStory(Story story);
    Optional<Vote> findByStoryAndUser(Story story, User user);    void deleteByStory(Story story);}
