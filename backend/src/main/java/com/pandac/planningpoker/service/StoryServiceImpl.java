package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.CreateStoryRequest;
import com.pandac.planningpoker.dto.UpdateStoryRequest;
import com.pandac.planningpoker.exception.StoryNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.StoryRepository;
import com.pandac.planningpoker.repository.VoteRepository;
import com.pandac.planningpoker.repository.SessionRepository;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import com.pandac.planningpoker.service.interfaces.IStoryService;
import com.pandac.planningpoker.security.SessionAccessValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StoryServiceImpl implements IStoryService {

    private final StoryRepository storyRepository;
    private final VoteRepository voteRepository;
    private final SessionRepository sessionRepository;
    private final ISessionService sessionService;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final SessionAccessValidator sessionAccessValidator;

    public Story createStory(String sessionCode, CreateStoryRequest request) {
        Session session = sessionService.getSession(sessionCode);

        List<Story> existing = storyRepository.findBySessionOrderByOrderIndex(session);

        Story story = new Story();
        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setAcceptanceCriteria(request.getAcceptanceCriteria());
        story.setSession(session);
        story.setOrderIndex(existing.size());
        story.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            story.setTags(request.getTags());
        }

        return storyRepository.save(story);
    }

    public List<Story> getStories(String sessionCode, StoryStatus status) {
        Session session = sessionService.getSession(sessionCode);
        if (status != null) {
            return storyRepository.findBySessionAndStatusOrderByOrderIndex(session, status);
        }
        return storyRepository.findBySessionOrderByOrderIndex(session);
    }

    public Story getStory(String sessionCode, Long storyId) {
        Session session = sessionService.getSession(sessionCode);
        Story story = storyRepository.findById(storyId).orElseThrow(() -> new StoryNotFoundException(storyId));
        sessionAccessValidator.requireStoryBelongsToSession(story, session);
        return story;
    }

    public Story updateStory(String sessionCode, Long storyId, UpdateStoryRequest request) {
        Story story = getStory(sessionCode, storyId);

        if (request.getTitle() != null) story.setTitle(request.getTitle());
        if (request.getDescription() != null) story.setDescription(request.getDescription());
        if (request.getAcceptanceCriteria() != null) story.setAcceptanceCriteria(request.getAcceptanceCriteria());
        if (request.getPriority() != null) story.setPriority(request.getPriority());
        if (request.getTags() != null) story.setTags(request.getTags());

        return storyRepository.save(story);
    }

    public void deleteStory(String sessionCode, Long storyId) {
        Story story = getStory(sessionCode, storyId);
        storyRepository.delete(story);
    }

    public Story finalizeEstimate(String sessionCode, Long storyId, String finalEstimate, String notes) {
        Story story = getStory(sessionCode, storyId);

        story.setFinalEstimate(finalEstimate);
        story.setEstimateNotes(notes);
        story.setStatus(StoryStatus.COMPLETED);

        Story saved = storyRepository.save(story);
        webSocketEventPublisher.storyFinalized(sessionCode, saved);
        return saved;
    }

    public Story resetStory(String sessionCode, Long storyId) {
        Session session = sessionService.getSession(sessionCode);
        Story story = storyRepository.findById(storyId).orElseThrow(() -> new StoryNotFoundException(storyId));
        sessionAccessValidator.requireStoryBelongsToSession(story, session);

        voteRepository.deleteByStory(story);
        story.setFinalEstimate(null);
        story.setEstimateNotes(null);
        story.setStatus(StoryStatus.NOT_ESTIMATED);

        if (session.getCurrentStoryId() != null && session.getCurrentStoryId().equals(storyId)) {
            session.setVotesRevealed(false);
            sessionRepository.save(session);
        }

        Story saved = storyRepository.save(story);
        webSocketEventPublisher.storyReset(sessionCode, saved);
        return saved;
    }
}
