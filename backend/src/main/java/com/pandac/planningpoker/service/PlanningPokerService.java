package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import com.pandac.planningpoker.service.interfaces.IStoryService;
import com.pandac.planningpoker.service.interfaces.IVoteService;
import com.pandac.planningpoker.service.interfaces.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Backward-compatible facade that delegates to the focused service layer.
 * All business logic lives in {@link SessionService}, {@link StoryService},
 * {@link VoteService}, and {@link UserService}.
 *
 * @see SessionService
 * @see StoryService
 * @see VoteService
 * @see UserService
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlanningPokerService {

    private final ISessionService sessionService;
    private final IStoryService storyService;
    private final IVoteService voteService;
    private final IUserService userService;
    
    // ==================== SESSION ====================

    public CreateSessionResponse createSession(CreateSessionRequest request) { return sessionService.createSession(request); }

    public Session getSession(String sessionCode) { return sessionService.getSession(sessionCode); }

    public Session updateSession(String sessionCode, UpdateSessionRequest request) { return sessionService.updateSession(sessionCode, request); }

    public void deleteSession(String sessionCode) { sessionService.deleteSession(sessionCode); }

    public UserSession joinSession(String sessionCode, JoinSessionRequest request) { return sessionService.joinSession(sessionCode, request); }

    public void leaveSession(String sessionCode, Long userId) { sessionService.leaveSession(sessionCode, userId); }

    public VoteReveal revealVotes(String sessionCode) { return sessionService.revealVotes(sessionCode); }

    public void resetVotes(String sessionCode) { sessionService.resetVotes(sessionCode); }

    public Session setCurrentStory(String sessionCode, Long storyId) { return sessionService.setCurrentStory(sessionCode, storyId); }

    // ==================== STORY ====================

    public Story createStory(String sessionCode, CreateStoryRequest request) { return storyService.createStory(sessionCode, request); }

    public List<Story> getStories(String sessionCode, StoryStatus status) { return storyService.getStories(sessionCode, status); }

    public Story getStory(String sessionCode, Long storyId) { return storyService.getStory(sessionCode, storyId); }

    public Story updateStory(String sessionCode, Long storyId, UpdateStoryRequest request) { return storyService.updateStory(sessionCode, storyId, request); }

    public void deleteStory(String sessionCode, Long storyId) { storyService.deleteStory(sessionCode, storyId); }

    public Story finalizeEstimate(String sessionCode, Long storyId, String finalEstimate, String notes) { return storyService.finalizeEstimate(sessionCode, storyId, finalEstimate, notes); }

    public Story resetStory(String sessionCode, Long storyId) { return storyService.resetStory(sessionCode, storyId); }

    // ==================== VOTE ====================

    public Vote castVote(String sessionCode, Long storyId, Long userId, VoteRequest request) { return voteService.castVote(sessionCode, storyId, userId, request); }

    public List<VoteResponse> getVotes(String sessionCode, Long storyId, Boolean revealed) { return voteService.getVotes(sessionCode, storyId, revealed); }

    public void deleteVote(String sessionCode, Long storyId, Long userId) { voteService.deleteVote(sessionCode, storyId, userId); }

    // ==================== USER ====================

    public List<User> getActiveUsers(String sessionCode, Boolean activeOnly) { return userService.getActiveUsers(sessionCode, activeOnly); }

    public User getUser(String sessionCode, Long userId) { return userService.getUser(sessionCode, userId); }

    public User updateUser(String sessionCode, Long userId, UpdateUserRequest request) { return userService.updateUser(sessionCode, userId, request); }
}
