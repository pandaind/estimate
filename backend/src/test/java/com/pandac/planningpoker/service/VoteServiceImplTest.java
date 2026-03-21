package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.VoteRequest;
import com.pandac.planningpoker.exception.InvalidVoteException;
import com.pandac.planningpoker.exception.StoryNotFoundException;
import com.pandac.planningpoker.exception.UserNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.SessionRepository;
import com.pandac.planningpoker.repository.StoryRepository;
import com.pandac.planningpoker.repository.UserRepository;
import com.pandac.planningpoker.repository.VoteRepository;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoteServiceImplTest {

    @Mock StoryRepository storyRepository;
    @Mock UserRepository userRepository;
    @Mock VoteRepository voteRepository;
    @Mock SessionRepository sessionRepository;
    @Mock ISessionService sessionService;
    @Mock WebSocketEventPublisher webSocketEventPublisher;
    @Mock SessionAccessValidator sessionAccessValidator;
    @Mock VoteStatisticsCalculator voteStatisticsCalculator;
    @Mock VoteResponseMapper voteResponseMapper;

    @InjectMocks VoteServiceImpl voteService;

    private Session session;
    private Story story;
    private User voter;
    private VoteRequest voteRequest;

    @BeforeEach
    void setUp() {
        SessionSettings settings = new SessionSettings();
        settings.setAllowChangeVote(true);
        settings.setAutoReveal(false);

        session = new Session();
        session.setId(1L);
        session.setSessionCode("VOT001");
        session.setActive(true);
        session.setSettings(settings);
        session.setVotesRevealed(false);

        story = new Story();
        story.setId(10L);
        story.setSession(session);

        voter = new User();
        voter.setId(5L);
        voter.setName("Alice");
        voter.setObserver(false);
        voter.setActive(true);
        voter.setSession(session);

        voteRequest = new VoteRequest();
        voteRequest.setEstimate("5");
    }

    // ─── castVote ────────────────────────────────────────────────────────────────

    @Test
    void castVote_validVoter_savesAndReturnsVote() {
        Vote savedVote = new Vote();
        savedVote.setId(1L);
        savedVote.setEstimate("5");

        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(5L)).thenReturn(Optional.of(voter));
        when(voteRepository.findByStoryAndUser(story, voter)).thenReturn(Optional.empty());
        when(voteRepository.save(any(Vote.class))).thenReturn(savedVote);
        when(voteRepository.findByStory(story)).thenReturn(List.of(savedVote));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
        doNothing().when(sessionAccessValidator).requireUserBelongsToSession(voter, session);

        Vote result = voteService.castVote("VOT001", 10L, 5L, voteRequest);

        assertThat(result.getEstimate()).isEqualTo("5");
        verify(voteRepository).save(any(Vote.class));
        verify(webSocketEventPublisher).voteCast(eq("VOT001"), eq(10L), anyInt());
    }

    @Test
    void castVote_observer_throwsInvalidVoteException() {
        voter.setObserver(true);

        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(5L)).thenReturn(Optional.of(voter));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
        doNothing().when(sessionAccessValidator).requireUserBelongsToSession(voter, session);

        assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 5L, voteRequest))
                .isInstanceOf(InvalidVoteException.class)
                .hasMessageContaining("Observers cannot vote");
    }

    @Test
    void castVote_inactiveUser_throwsInvalidVoteException() {
        voter.setActive(false);

        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(5L)).thenReturn(Optional.of(voter));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
        doNothing().when(sessionAccessValidator).requireUserBelongsToSession(voter, session);

        assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 5L, voteRequest))
                .isInstanceOf(InvalidVoteException.class)
                .hasMessageContaining("Inactive users cannot vote");
    }

    @Test
    void castVote_voteChangeNotAllowedAfterReveal_throwsInvalidVoteException() {
        session.getSettings().setAllowChangeVote(false);
        session.setVotesRevealed(true);

        Vote existingVote = new Vote();
        existingVote.setEstimate("3");

        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(5L)).thenReturn(Optional.of(voter));
        when(voteRepository.findByStoryAndUser(story, voter)).thenReturn(Optional.of(existingVote));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
        doNothing().when(sessionAccessValidator).requireUserBelongsToSession(voter, session);

        assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 5L, voteRequest))
                .isInstanceOf(InvalidVoteException.class)
                .hasMessageContaining("Vote changes are not allowed after reveal");
    }

    @Test
    void castVote_voteChangeAllowedAfterReveal_updatesVote() {
        session.getSettings().setAllowChangeVote(true);
        session.setVotesRevealed(true);

        Vote existingVote = new Vote();
        existingVote.setId(1L);
        existingVote.setEstimate("3");

        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(5L)).thenReturn(Optional.of(voter));
        when(voteRepository.findByStoryAndUser(story, voter)).thenReturn(Optional.of(existingVote));
        when(voteRepository.save(any(Vote.class))).thenReturn(existingVote);
        when(voteRepository.findByStory(story)).thenReturn(List.of(existingVote));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);
        doNothing().when(sessionAccessValidator).requireUserBelongsToSession(voter, session);

        Vote result = voteService.castVote("VOT001", 10L, 5L, voteRequest);

        assertThat(result.getEstimate()).isEqualTo("5");
    }

    @Test
    void castVote_storyNotFound_throwsStoryNotFoundException() {
        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> voteService.castVote("VOT001", 999L, 5L, voteRequest))
                .isInstanceOf(StoryNotFoundException.class);
    }

    @Test
    void castVote_userNotFound_throwsUserNotFoundException() {
        when(sessionService.getSession("VOT001")).thenReturn(session);
        when(storyRepository.findById(10L)).thenReturn(Optional.of(story));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);

        assertThatThrownBy(() -> voteService.castVote("VOT001", 10L, 999L, voteRequest))
                .isInstanceOf(UserNotFoundException.class);
    }
}
