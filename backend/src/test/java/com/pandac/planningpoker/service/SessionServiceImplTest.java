package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.exception.SessionNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.*;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SessionAccessValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock SessionRepository sessionRepository;
    @Mock StoryRepository storyRepository;
    @Mock UserRepository userRepository;
    @Mock VoteRepository voteRepository;
    @Mock WebSocketEventPublisher webSocketEventPublisher;
    @Mock JwtTokenService jwtTokenService;
    @Mock SessionAccessValidator sessionAccessValidator;
    @Mock VoteStatisticsCalculator voteStatisticsCalculator;
    @Mock VoteResponseMapper voteResponseMapper;

    @InjectMocks
    SessionServiceImpl sessionService;

    private Session session;

    @BeforeEach
    void setUp() {
        session = new Session();
        session.setId(1L);
        session.setSessionCode("ABC123");
        session.setName("Test Session");
        session.setSizingMethod(SizingMethod.FIBONACCI);
        session.setActive(true);
        session.setVotesRevealed(false);
        session.setModeratorCanVote(false);
        session.setUsers(new ArrayList<>());
        session.setStories(new ArrayList<>());
    }

    // ─── createSession ──────────────────────────────────────────────────────────

    @Test
    void createSession_withFibonacci_savesSessionAndReturnsModerator() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Sprint 1");
        request.setSizingMethod(SizingMethod.FIBONACCI);
        request.setModeratorName("Alice");
        request.setModeratorCanVote(false);

        User savedModerator = new User();
        savedModerator.setId(10L);
        savedModerator.setName("Alice");

        Session savedSession = new Session();
        savedSession.setId(1L);
        savedSession.setSessionCode("XYZ999");
        savedSession.setSettings(new com.pandac.planningpoker.model.SessionSettings());

        when(sessionRepository.findBySessionCode(anyString())).thenReturn(Optional.empty());
        when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);
        when(userRepository.save(any(User.class))).thenReturn(savedModerator);
        when(jwtTokenService.generateToken(anyString(), anyLong(), any())).thenReturn("token");

        CreateSessionResponse response = sessionService.createSession(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("token");
        verify(sessionRepository, atLeastOnce()).save(any(Session.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createSession_withCustomSizing_validatesValues() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Custom Sprint");
        request.setSizingMethod(SizingMethod.CUSTOM);
        request.setCustomValues(new String[]{"XS", "S", "M", "L", "XL"});
        request.setModeratorName("Bob");

        User savedModerator = new User();
        savedModerator.setId(11L);
        savedModerator.setName("Bob");

        Session savedSession = new Session();
        savedSession.setId(2L);
        savedSession.setSessionCode("CUS001");
        savedSession.setSettings(new com.pandac.planningpoker.model.SessionSettings());

        when(sessionRepository.findBySessionCode(anyString())).thenReturn(Optional.empty());
        when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);
        when(userRepository.save(any(User.class))).thenReturn(savedModerator);
        when(jwtTokenService.generateToken(anyString(), anyLong(), any())).thenReturn("tok");

        assertThatNoException().isThrownBy(() -> sessionService.createSession(request));
    }

    @Test
    void createSession_withCustomSizingAndNoValues_throwsIllegalArgument() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Bad Custom");
        request.setSizingMethod(SizingMethod.CUSTOM);
        request.setCustomValues(new String[]{});
        request.setModeratorName("Bob");

        assertThatThrownBy(() -> sessionService.createSession(request))
                .isInstanceOf(java.lang.IllegalArgumentException.class)
                .hasMessageContaining("CUSTOM sizing method requires at least one value");
    }

    @Test
    void createSession_withCustomSizingValueTooLong_throwsIllegalArgument() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Bad Custom");
        request.setSizingMethod(SizingMethod.CUSTOM);
        request.setCustomValues(new String[]{"TOOLONGVALUE"});  // 11 chars > 10 limit
        request.setModeratorName("Bob");

        assertThatThrownBy(() -> sessionService.createSession(request))
                .isInstanceOf(java.lang.IllegalArgumentException.class)
                .hasMessageContaining("10 characters or fewer");
    }

    @Test
    void createSession_withCustomSizingTooManyValues_throwsIllegalArgument() {
        String[] values = new String[21];
        for (int i = 0; i < 21; i++) values[i] = String.valueOf(i);

        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Too Many");
        request.setSizingMethod(SizingMethod.CUSTOM);
        request.setCustomValues(values);
        request.setModeratorName("Carol");

        assertThatThrownBy(() -> sessionService.createSession(request))
                .isInstanceOf(java.lang.IllegalArgumentException.class)
                .hasMessageContaining("maximum of 20 values");
    }

    // ─── getSession ─────────────────────────────────────────────────────────────

    @Test
    void getSession_existingCode_returnsSession() {
        when(sessionRepository.findBySessionCodeAndActive("ABC123", true)).thenReturn(Optional.of(session));
        Session result = sessionService.getSession("ABC123");
        assertThat(result.getSessionCode()).isEqualTo("ABC123");
    }

    @Test
    void getSession_unknownCode_throwsSessionNotFoundException() {
        when(sessionRepository.findBySessionCodeAndActive("XXXXXX", true)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> sessionService.getSession("XXXXXX"))
                .isInstanceOf(SessionNotFoundException.class);
    }

    // ─── deleteSession ───────────────────────────────────────────────────────────

    @Test
    void deleteSession_softDeletesCascadeToUsersAndStories() {
        User activeUser = new User();
        activeUser.setId(5L);
        activeUser.setActive(true);

        Story activeStory = new Story();
        activeStory.setId(3L);
        activeStory.setStatus(StoryStatus.IN_PROGRESS);

        session.setUsers(List.of(activeUser));
        session.setStories(List.of(activeStory));

        when(sessionRepository.findBySessionCodeAndActive("ABC123", true)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        sessionService.deleteSession("ABC123");

        assertThat(session.isActive()).isFalse();
        assertThat(activeUser.isActive()).isFalse();
        assertThat(activeStory.getStatus()).isEqualTo(StoryStatus.NOT_ESTIMATED);
        verify(sessionRepository).save(session);
    }
}
