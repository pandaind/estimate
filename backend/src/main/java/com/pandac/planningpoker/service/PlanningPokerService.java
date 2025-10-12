package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.exception.*;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.*;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlanningPokerService {
    
    private final SessionRepository sessionRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtTokenService jwtTokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();
    
    // ==================== SESSION METHODS ====================
    
    public CreateSessionResponse createSession(CreateSessionRequest request) {
        Session session = new Session();
        session.setSessionCode(generateUniqueSessionCode());
        session.setName(request.getName());
        session.setDescription(request.getDescription());
        session.setSizingMethod(request.getSizingMethod());
        session.setModeratorCanVote(request.getModeratorCanVote() != null ? request.getModeratorCanVote() : false);
        
        // Store custom values as JSON if provided
        if (request.getCustomValues() != null && request.getCustomValues().length > 0) {
            try {
                session.setCustomValues(objectMapper.writeValueAsString(request.getCustomValues()));
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize custom values");
            }
        }
        
        // Apply session settings
        if (request.getSettings() != null) {
            SessionSettings settings = request.getSettings();
            session.setAutoReveal(settings.getAutoReveal());
            session.setTimerEnabled(settings.getTimerEnabled());
            session.setTimerDuration(settings.getTimerDuration());
            session.setAllowChangeVote(settings.getAllowChangeVote());
            session.setAllowObservers(settings.getAllowObservers());
            session.setRequireConfidence(settings.getRequireConfidence());
        }
        
        session = sessionRepository.save(session);
        
        // Create moderator user
        User moderator = new User();
        moderator.setName(request.getModeratorName());
        moderator.setAvatar(request.getModeratorAvatar());
        moderator.setSession(session);
        moderator.setIsModerator(true);
        moderator.setIsObserver(false);
        moderator = userRepository.save(moderator);
        
        session.setModeratorId(moderator.getId());
        session = sessionRepository.save(session);
        
        // Generate JWT token for moderator
        String token = jwtTokenService.generateToken(session.getSessionCode(), moderator.getId(), UserRole.MODERATOR);
        
        // Return response with session and token
        CreateSessionResponse response = new CreateSessionResponse();
        response.setSession(session);
        response.setToken(token);
        response.setModeratorId(moderator.getId());
        response.setModerator(moderator);
        
        return response;
    }
    
    public Session updateSession(String sessionCode, UpdateSessionRequest request) {
        Session session = getSession(sessionCode);
        
        if (request.getName() != null) {
            session.setName(request.getName());
        }
        if (request.getDescription() != null) {
            session.setDescription(request.getDescription());
        }
        
        boolean timerSettingsChanged = false;
        Boolean newTimerEnabled = null;
        Integer newTimerDuration = null;
        
        if (request.getSettings() != null) {
            SessionSettings settings = request.getSettings();
            if (settings.getAutoReveal() != null) session.setAutoReveal(settings.getAutoReveal());
            if (settings.getTimerEnabled() != null) {
                timerSettingsChanged = true;
                newTimerEnabled = settings.getTimerEnabled();
                session.setTimerEnabled(settings.getTimerEnabled());
            }
            if (settings.getTimerDuration() != null) {
                timerSettingsChanged = true;
                newTimerDuration = settings.getTimerDuration();
                session.setTimerDuration(settings.getTimerDuration());
            }
            if (settings.getAllowChangeVote() != null) session.setAllowChangeVote(settings.getAllowChangeVote());
            if (settings.getAllowObservers() != null) session.setAllowObservers(settings.getAllowObservers());
            if (settings.getRequireConfidence() != null) session.setRequireConfidence(settings.getRequireConfidence());
        }
        
        Session savedSession = sessionRepository.save(session);
        
        // Broadcast timer settings changes to all participants via WebSocket
        if (timerSettingsChanged) {
            try {
                Map<String, Object> message = new HashMap<>();
                message.put("type", "TIMER_SETTINGS_CHANGED");
                message.put("timerEnabled", savedSession.getTimerEnabled());
                message.put("timerDuration", savedSession.getTimerDuration());
                messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/timer", message);
            } catch (Exception e) {
                log.error("Failed to broadcast timer settings for session {}: {}", sessionCode, e.getMessage());
            }
        }
        
        return savedSession;
    }
    
    public void deleteSession(String sessionCode) {
        Session session = getSession(sessionCode);
        session.setIsActive(false);
        sessionRepository.save(session);
    }
    
    public UserSession joinSession(String sessionCode, JoinSessionRequest request) {
        Session session = sessionRepository.findBySessionCodeAndIsActive(sessionCode, true)
                .orElseThrow(() -> new SessionNotFoundException(sessionCode));
        
        // Check if user already exists in this session
        Optional<User> existingUser = userRepository.findByNameAndSession(request.getName(), session);
        User user;
        
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setIsActive(true);
            user.setIsObserver(request.getIsObserver());
            if (request.getAvatar() != null) {
                user.setAvatar(request.getAvatar());
            }
            userRepository.save(user);
        } else {
            // Create new user
            user = new User();
            user.setName(request.getName());
            user.setAvatar(request.getAvatar());
            user.setSession(session);
            user.setIsObserver(request.getIsObserver());
            user.setIsModerator(false);
            user = userRepository.save(user);
        }
        
        // Determine user role for JWT
        UserRole role = user.getIsModerator() ? UserRole.MODERATOR : (user.getIsObserver() ? UserRole.OBSERVER : UserRole.PARTICIPANT);
        
        // Generate JWT token
        String token = jwtTokenService.generateToken(sessionCode, user.getId(), role);
        
        UserSession userSession = new UserSession();
        userSession.setSessionCode(sessionCode);
        userSession.setUserId(user.getId());
        userSession.setUser(user);
        userSession.setSession(session);
        userSession.setToken(token);
        
        // Broadcast user join event to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "USER_JOINED");
            message.put("userId", user.getId());
            message.put("userName", user.getName());
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/users", message);
        } catch (Exception e) {
            log.error("Failed to broadcast user join for session {}: {}", sessionCode, e.getMessage());
        }
        
        return userSession;
    }
    
    public void leaveSession(String sessionCode, Long userId) {
        Session session = getSession(sessionCode);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        if (!user.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("User does not belong to this session");
        }
        
        user.setIsActive(false);
        userRepository.save(user);
        
        // Broadcast user leave event to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "USER_LEFT");
            message.put("userId", user.getId());
            message.put("userName", user.getName());
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/users", message);
        } catch (Exception e) {
            log.error("Failed to broadcast user leave for session {}: {}", sessionCode, e.getMessage());
        }
    }
    
    public Session getSession(String sessionCode) {
        return sessionRepository.findBySessionCodeAndIsActive(sessionCode, true)
                .orElseThrow(() -> new SessionNotFoundException(sessionCode));
    }
    
    public VoteReveal revealVotes(String sessionCode) {
        Session session = getSession(sessionCode);
        
        if (session.getCurrentStoryId() == null) {
            throw new RuntimeException("No current story set for voting");
        }
        
        Story story = storyRepository.findById(session.getCurrentStoryId())
                .orElseThrow(() -> new StoryNotFoundException(session.getCurrentStoryId()));
        
        List<Vote> votes = voteRepository.findByStory(story);
        List<VoteResponse> voteResponses = votes.stream()
                .map(this::convertToVoteResponse)
                .collect(Collectors.toList());
        
        session.setVotesRevealed(true);
        sessionRepository.save(session);
        
        story.setStatus(StoryStatus.IN_PROGRESS);
        storyRepository.save(story);
        
        VoteReveal reveal = new VoteReveal();
        reveal.setStoryId(story.getId());
        reveal.setVotes(voteResponses);
        reveal.setConsensus(checkConsensus(votes));
        
        // Calculate statistics
        Map<String, Integer> distribution = new HashMap<>();
        List<String> numericVotes = new ArrayList<>();
        
        for (Vote vote : votes) {
            distribution.put(vote.getEstimate(), 
                distribution.getOrDefault(vote.getEstimate(), 0) + 1);
            
            try {
                Double.parseDouble(vote.getEstimate());
                numericVotes.add(vote.getEstimate());
            } catch (NumberFormatException e) {
                // Non-numeric vote (?, ☕, ∞)
            }
        }
        
        reveal.setDistribution(distribution);
        
        if (!numericVotes.isEmpty()) {
            double avg = numericVotes.stream()
                    .mapToDouble(Double::parseDouble)
                    .average()
                    .orElse(0.0);
            reveal.setAverageEstimate(avg);
            
            List<Double> sorted = numericVotes.stream()
                    .map(Double::parseDouble)
                    .sorted()
                    .collect(Collectors.toList());
            int mid = sorted.size() / 2;
            reveal.setMedianEstimate(sorted.size() % 2 == 0 ?
                    String.valueOf((sorted.get(mid-1) + sorted.get(mid)) / 2) :
                    String.valueOf(sorted.get(mid)));
        }
        
        // Find mode (most common vote)
        reveal.setRecommendedEstimate(
                distribution.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null)
        );
        
        // Broadcast reveal event to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "VOTES_REVEALED");
            message.put("storyId", story.getId());
            message.put("sessionCode", sessionCode);
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/reveal", message);
        } catch (Exception e) {
            log.error("Failed to broadcast vote reveal for session {}: {}", sessionCode, e.getMessage());
        }
        
        return reveal;
    }
    
    public void resetVotes(String sessionCode) {
        Session session = getSession(sessionCode);
        
        if (session.getCurrentStoryId() == null) {
            throw new RuntimeException("No current story set");
        }
        
        Story story = storyRepository.findById(session.getCurrentStoryId())
                .orElseThrow(() -> new StoryNotFoundException(session.getCurrentStoryId()));
        
        voteRepository.deleteByStory(story);
        
        session.setVotesRevealed(false);
        sessionRepository.save(session);
        
        story.setStatus(StoryStatus.NOT_ESTIMATED);
        storyRepository.save(story);
        
        // Broadcast votes reset to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "VOTES_RESET");
            message.put("storyId", story.getId());
            message.put("sessionCode", sessionCode);
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/reveal", message);
        } catch (Exception e) {
            log.error("Failed to broadcast vote reset for session {}: {}", sessionCode, e.getMessage());
        }
    }
    
    // ==================== STORY METHODS ====================
    
    public Story createStory(String sessionCode, CreateStoryRequest request) {
        Session session = getSession(sessionCode);
        
        // Get the next order index
        List<Story> existingStories = storyRepository.findBySessionOrderByOrderIndex(session);
        int nextOrderIndex = existingStories.size();
        
        Story story = new Story();
        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setAcceptanceCriteria(request.getAcceptanceCriteria());
        story.setSession(session);
        story.setOrderIndex(nextOrderIndex);
        story.setPriority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM);
        
        // Store tags as JSON if provided
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            try {
                story.setTags(objectMapper.writeValueAsString(request.getTags()));
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize tags");
            }
        }
        
        return storyRepository.save(story);
    }
    
    public List<Story> getStories(String sessionCode, StoryStatus status) {
        Session session = getSession(sessionCode);
        if (status != null) {
            return storyRepository.findBySessionAndStatusOrderByOrderIndex(session, status);
        }
        return storyRepository.findBySessionOrderByOrderIndex(session);
    }
    
    public Story getStory(String sessionCode, Long storyId) {
        Session session = getSession(sessionCode);
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        return story;
    }
    
    public Story updateStory(String sessionCode, Long storyId, UpdateStoryRequest request) {
        Story story = getStory(sessionCode, storyId);
        
        if (request.getTitle() != null) {
            story.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            story.setDescription(request.getDescription());
        }
        if (request.getAcceptanceCriteria() != null) {
            story.setAcceptanceCriteria(request.getAcceptanceCriteria());
        }
        if (request.getPriority() != null) {
            story.setPriority(request.getPriority());
        }
        if (request.getTags() != null) {
            try {
                story.setTags(objectMapper.writeValueAsString(request.getTags()));
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize tags");
            }
        }
        
        return storyRepository.save(story);
    }
    
    public void deleteStory(String sessionCode, Long storyId) {
        Story story = getStory(sessionCode, storyId);
        storyRepository.delete(story);
    }
    
    public Story finalizeEstimate(String sessionCode, Long storyId, String finalEstimate, String notes) {
        Session session = getSession(sessionCode);
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        story.setFinalEstimate(finalEstimate);
        story.setEstimateNotes(notes);
        story.setStatus(StoryStatus.COMPLETED);
        
        Story savedStory = storyRepository.save(story);
        
        // Broadcast story finalization to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "STORY_FINALIZED");
            message.put("story", savedStory);
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/story", message);
        } catch (Exception e) {
            log.error("Failed to broadcast story finalization for session {}: {}", sessionCode, e.getMessage());
        }
        
        return savedStory;
    }
    
    // ==================== VOTING METHODS ====================
    
    public Vote castVote(String sessionCode, Long storyId, Long userId, VoteRequest request) {
        Session session = getSession(sessionCode);
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        if (!user.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("User does not belong to this session");
        }
        
        if (user.getIsObserver()) {
            throw new InvalidVoteException("Observers cannot vote");
        }
        
        if (!user.getIsActive()) {
            throw new InvalidVoteException("Inactive users cannot vote");
        }
        
        // Check if user already voted for this story
        Optional<Vote> existingVote = voteRepository.findByStoryAndUser(story, user);
        Vote vote;
        
        if (existingVote.isPresent()) {
            if (!session.getAllowChangeVote() && session.getVotesRevealed()) {
                throw new InvalidVoteException("Vote changes are not allowed after reveal");
            }
            vote = existingVote.get();
            vote.setEstimate(request.getEstimate());
            vote.setConfidence(request.getConfidence());
        } else {
            vote = new Vote();
            vote.setStory(story);
            vote.setUser(user);
            vote.setEstimate(request.getEstimate());
            vote.setConfidence(request.getConfidence());
        }
        
        vote = voteRepository.save(vote);
        
        // Check for auto-reveal
        if (session.getAutoReveal() && !session.getVotesRevealed()) {
            List<User> activeUsers = userRepository.findBySessionAndIsActiveAndIsObserver(session, true, false);
            List<Vote> currentVotes = voteRepository.findByStory(story);
            
            if (currentVotes.size() >= activeUsers.size()) {
                session.setVotesRevealed(true);
                sessionRepository.save(session);
            }
        }
        
        return vote;
    }
    
    public List<VoteResponse> getVotes(String sessionCode, Long storyId, Boolean revealed) {
        Session session = getSession(sessionCode);
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        if (revealed && !session.getVotesRevealed()) {
            return new ArrayList<>(); // Don't show votes if not revealed
        }
        
        List<Vote> votes = voteRepository.findByStory(story);
        return votes.stream()
                .map(this::convertToVoteResponse)
                .collect(Collectors.toList());
    }
    
    public void deleteVote(String sessionCode, Long storyId, Long userId) {
        Session session = getSession(sessionCode);
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        // Make delete idempotent - if vote doesn't exist, just return success
        Optional<Vote> vote = voteRepository.findByStoryAndUser(story, user);
        vote.ifPresent(voteRepository::delete);
    }
    
    // ==================== USER METHODS ====================
    
    public List<User> getActiveUsers(String sessionCode, Boolean activeOnly) {
        Session session = getSession(sessionCode);
        if (activeOnly) {
            return userRepository.findBySessionAndIsActive(session, true);
        }
        return userRepository.findBySession(session);
    }
    
    public User getUser(String sessionCode, Long userId) {
        Session session = getSession(sessionCode);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        if (!user.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("User does not belong to this session");
        }
        
        return user;
    }
    
    public User updateUser(String sessionCode, Long userId, UpdateUserRequest request) {
        User user = getUser(sessionCode, userId);
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        
        return userRepository.save(user);
    }
    
    public Session setCurrentStory(String sessionCode, Long storyId) {
        Session session = getSession(sessionCode);
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        session.setCurrentStoryId(storyId);
        session.setVotesRevealed(false);
        Session savedSession = sessionRepository.save(session);
        
        // Broadcast story activation to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "STORY_ACTIVATED");
            message.put("story", story);
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/story", message);
        } catch (Exception e) {
            log.error("Failed to broadcast story activation for session {}: {}", sessionCode, e.getMessage());
        }
        
        return savedSession;
    }
    
    // ==================== HELPER METHODS ====================
    
    private boolean checkConsensus(List<Vote> votes) {
        if (votes.isEmpty()) {
            return false;
        }
        
        String firstVote = votes.get(0).getEstimate();
        return votes.stream().allMatch(v -> v.getEstimate().equals(firstVote));
    }
    
    private String generateUniqueSessionCode() {
        String code;
        do {
            code = generateSessionCode();
        } while (sessionRepository.findBySessionCode(code).isPresent());
        return code;
    }
    
    private String generateSessionCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }
    
    private VoteResponse convertToVoteResponse(Vote vote) {
        VoteResponse response = new VoteResponse();
        response.setId(vote.getId());
        response.setEstimate(vote.getEstimate());
        response.setConfidence(vote.getConfidence());
        response.setVotedAt(vote.getVotedAt());
        
        // Convert user information
        User user = vote.getUser();
        VoteResponse.UserInfo userInfo = new VoteResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setName(user.getName());
        userInfo.setAvatar(user.getAvatar());
        userInfo.setIsModerator(user.getIsModerator());
        userInfo.setIsObserver(user.getIsObserver());
        
        response.setUser(userInfo);
        return response;
    }
    
    public Story resetStory(String sessionCode, Long storyId) {
        Session session = getSession(sessionCode);
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new RuntimeException("Story does not belong to this session");
        }
        
        // Delete all votes for this story
        voteRepository.deleteByStory(story);
        
        // Clear finalized data
        story.setFinalEstimate(null);
        story.setEstimateNotes(null);
        story.setStatus(StoryStatus.NOT_ESTIMATED);
        
        // If this is the current story, reset votesRevealed
        if (session.getCurrentStoryId() != null && session.getCurrentStoryId().equals(storyId)) {
            session.setVotesRevealed(false);
            sessionRepository.save(session);
        }
        
        Story savedStory = storyRepository.save(story);
        
        // Broadcast story reset to all participants via WebSocket
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "STORY_RESET");
            message.put("story", savedStory);
            messagingTemplate.convertAndSend("/topic/session/" + sessionCode + "/story", message);
        } catch (Exception e) {
            log.error("Failed to broadcast story reset for session {}: {}", sessionCode, e.getMessage());
        }
        
        return savedStory;
    }
}
