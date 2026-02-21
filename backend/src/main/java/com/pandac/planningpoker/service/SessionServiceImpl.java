package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.dto.SessionSettings; // explicit — disambiguates from model.SessionSettings
import com.pandac.planningpoker.exception.*;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.*;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.security.UserRole;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionServiceImpl implements ISessionService {

    private final SessionRepository sessionRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final JwtTokenService jwtTokenService;
    private final SessionAccessValidator sessionAccessValidator;
    private final VoteStatisticsCalculator voteStatisticsCalculator;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    // ── Session CRUD ───────────────────────────────────────────────────────────

    public CreateSessionResponse createSession(CreateSessionRequest request) {
        Session session = new Session();
        session.setSessionCode(generateUniqueSessionCode());
        session.setName(request.getName());
        session.setDescription(request.getDescription());
        session.setSizingMethod(request.getSizingMethod());
        session.setModeratorCanVote(request.getModeratorCanVote() != null ? request.getModeratorCanVote() : false);

        if (request.getCustomValues() != null && request.getCustomValues().length > 0) {
            session.setCustomValues(Arrays.asList(request.getCustomValues()));
        }

        if (request.getSettings() != null) {
            SessionSettings s = request.getSettings();
            if (s.getAutoReveal() != null) session.getSettings().setAutoReveal(s.getAutoReveal());
            if (s.getTimerEnabled() != null) session.getSettings().setTimerEnabled(s.getTimerEnabled());
            if (s.getTimerDuration() != null) session.getSettings().setTimerDuration(s.getTimerDuration());
            if (s.getAllowChangeVote() != null) session.getSettings().setAllowChangeVote(s.getAllowChangeVote());
            if (s.getAllowObservers() != null) session.getSettings().setAllowObservers(s.getAllowObservers());
            if (s.getRequireConfidence() != null) session.getSettings().setRequireConfidence(s.getRequireConfidence());
        }

        session = sessionRepository.save(session);

        User moderator = new User();
        moderator.setName(request.getModeratorName());
        moderator.setAvatar(request.getModeratorAvatar());
        moderator.setSession(session);
        moderator.setIsModerator(true);
        moderator.setIsObserver(false);
        moderator = userRepository.save(moderator);

        session.setModeratorId(moderator.getId());
        session = sessionRepository.save(session);

        String token = jwtTokenService.generateToken(session.getSessionCode(), moderator.getId(), UserRole.MODERATOR);

        CreateSessionResponse response = new CreateSessionResponse();
        response.setSession(session);
        response.setToken(token);
        response.setModeratorId(moderator.getId());
        response.setModerator(moderator);
        return response;
    }

    public Session getSession(String sessionCode) {
        return sessionRepository.findBySessionCodeAndIsActive(sessionCode, true)
                .orElseThrow(() -> new SessionNotFoundException(sessionCode));
    }

    public Session updateSession(String sessionCode, UpdateSessionRequest request) {
        Session session = getSession(sessionCode);

        if (request.getName() != null) session.setName(request.getName());
        if (request.getDescription() != null) session.setDescription(request.getDescription());

        boolean timerChanged = false;
        if (request.getSettings() != null) {
            SessionSettings s = request.getSettings();
            if (s.getAutoReveal() != null) session.getSettings().setAutoReveal(s.getAutoReveal());
            if (s.getTimerEnabled() != null) {
                timerChanged = true;
                session.getSettings().setTimerEnabled(s.getTimerEnabled());
            }
            if (s.getTimerDuration() != null) {
                timerChanged = true;
                session.getSettings().setTimerDuration(s.getTimerDuration());
            }
            if (s.getAllowChangeVote() != null) session.getSettings().setAllowChangeVote(s.getAllowChangeVote());
            if (s.getAllowObservers() != null) session.getSettings().setAllowObservers(s.getAllowObservers());
            if (s.getRequireConfidence() != null) session.getSettings().setRequireConfidence(s.getRequireConfidence());
        }

        Session saved = sessionRepository.save(session);
        if (timerChanged) {
            webSocketEventPublisher.timerSettingsChanged(sessionCode,
                    saved.getSettings().getTimerEnabled(), saved.getSettings().getTimerDuration());
        }
        return saved;
    }

    public void deleteSession(String sessionCode) {
        Session session = getSession(sessionCode);
        session.setIsActive(false);
        sessionRepository.save(session);
    }

    // ── Participants ───────────────────────────────────────────────────────────

    public UserSession joinSession(String sessionCode, JoinSessionRequest request) {
        Session session = sessionRepository.findBySessionCodeAndIsActive(sessionCode, true)
                .orElseThrow(() -> new SessionNotFoundException(sessionCode));

        Optional<User> existingUser = userRepository.findByNameAndSession(request.getName(), session);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setIsActive(true);
            user.setIsObserver(request.getIsObserver());
            if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
            userRepository.save(user);
        } else {
            user = new User();
            user.setName(request.getName());
            user.setAvatar(request.getAvatar());
            user.setSession(session);
            user.setIsObserver(request.getIsObserver());
            user.setIsModerator(false);
            user = userRepository.save(user);
        }

        UserRole role = user.getIsModerator() ? UserRole.MODERATOR
                : (user.getIsObserver() ? UserRole.OBSERVER : UserRole.PARTICIPANT);
        String token = jwtTokenService.generateToken(sessionCode, user.getId(), role);

        UserSession userSession = new UserSession();
        userSession.setSessionCode(sessionCode);
        userSession.setUserId(user.getId());
        userSession.setUser(user);
        userSession.setSession(session);
        userSession.setToken(token);

        webSocketEventPublisher.userJoined(sessionCode, user.getId(), user.getName());
        return userSession;
    }

    public void leaveSession(String sessionCode, Long userId) {
        Session session = getSession(sessionCode);
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        sessionAccessValidator.requireUserBelongsToSession(user, session);
        user.setIsActive(false);
        userRepository.save(user);
        webSocketEventPublisher.userLeft(sessionCode, user.getId(), user.getName());
    }

    // ── Reveal / Reset votes ───────────────────────────────────────────────────

    public VoteReveal revealVotes(String sessionCode) {
        Session session = getSession(sessionCode);
        if (session.getCurrentStoryId() == null) throw new NoActiveStoryException("No current story set for voting");

        Story story = storyRepository.findById(session.getCurrentStoryId())
                .orElseThrow(() -> new StoryNotFoundException(session.getCurrentStoryId()));

        List<Vote> votes = voteRepository.findByStory(story);
        List<VoteResponse> voteResponses = votes.stream().map(this::toVoteResponse).collect(Collectors.toList());

        session.setVotesRevealed(true);
        sessionRepository.save(session);
        story.setStatus(StoryStatus.IN_PROGRESS);
        storyRepository.save(story);

        VoteStatisticsCalculator.VoteStatistics stats = voteStatisticsCalculator.calculate(votes);

        VoteReveal reveal = new VoteReveal();
        reveal.setStoryId(story.getId());
        reveal.setVotes(voteResponses);
        reveal.setConsensus(stats.isConsensus());
        reveal.setDistribution(stats.getDistribution());
        if (stats.getAverage() != null) reveal.setAverageEstimate(stats.getAverage());
        if (stats.getMedian() != null) reveal.setMedianEstimate(stats.getMedian());
        reveal.setRecommendedEstimate(stats.getMode());

        webSocketEventPublisher.votesRevealed(sessionCode, story.getId());
        return reveal;
    }

    public void resetVotes(String sessionCode) {
        Session session = getSession(sessionCode);
        if (session.getCurrentStoryId() == null) throw new NoActiveStoryException("No current story set");

        Story story = storyRepository.findById(session.getCurrentStoryId())
                .orElseThrow(() -> new StoryNotFoundException(session.getCurrentStoryId()));

        voteRepository.deleteByStory(story);
        session.setVotesRevealed(false);
        sessionRepository.save(session);
        story.setStatus(StoryStatus.NOT_ESTIMATED);
        storyRepository.save(story);
        webSocketEventPublisher.votesReset(sessionCode, story.getId());
    }

    // ── Set current story ──────────────────────────────────────────────────────

    public Session setCurrentStory(String sessionCode, Long storyId) {
        Session session = getSession(sessionCode);
        Story story = storyRepository.findById(storyId).orElseThrow(() -> new StoryNotFoundException(storyId));
        session.setCurrentStoryId(storyId);
        session.setVotesRevealed(false);
        Session saved = sessionRepository.save(session);
        webSocketEventPublisher.storyActivated(sessionCode, story);
        return saved;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private VoteResponse toVoteResponse(Vote vote) {
        VoteResponse r = new VoteResponse();
        r.setId(vote.getId());
        r.setEstimate(vote.getEstimate());
        r.setConfidence(vote.getConfidence());
        r.setVotedAt(vote.getVotedAt());
        User u = vote.getUser();
        VoteResponse.UserInfo ui = new VoteResponse.UserInfo();
        ui.setId(u.getId());
        ui.setName(u.getName());
        ui.setAvatar(u.getAvatar());
        ui.setIsModerator(u.getIsModerator());
        ui.setIsObserver(u.getIsObserver());
        r.setUser(ui);
        return r;
    }

    private String generateUniqueSessionCode() {
        String code;
        do { code = generateSessionCode(); }
        while (sessionRepository.findBySessionCode(code).isPresent());
        return code;
    }

    private String generateSessionCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        return sb.toString();
    }
}
