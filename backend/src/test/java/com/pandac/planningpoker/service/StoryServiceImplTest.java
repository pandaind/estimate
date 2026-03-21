package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.CreateStoryRequest;
import com.pandac.planningpoker.exception.StoryNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.StoryRepository;
import com.pandac.planningpoker.repository.VoteRepository;
import com.pandac.planningpoker.repository.SessionRepository;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoryServiceImplTest {

    @Mock StoryRepository storyRepository;
    @Mock VoteRepository voteRepository;
    @Mock SessionRepository sessionRepository;
    @Mock ISessionService sessionService;
    @Mock WebSocketEventPublisher webSocketEventPublisher;
    @Mock SessionAccessValidator sessionAccessValidator;

    @InjectMocks StoryServiceImpl storyService;

    private Session session;

    @BeforeEach
    void setUp() {
        session = new Session();
        session.setId(1L);
        session.setSessionCode("SES001");
        session.setActive(true);
    }

    // ─── createStory ─────────────────────────────────────────────────────────────

    @Test
    void createStory_savesAndReturnsStory() {
        CreateStoryRequest request = new CreateStoryRequest();
        request.setTitle("As a user I want to login");
        request.setDescription("Login feature");

        Story saved = new Story();
        saved.setId(10L);
        saved.setTitle("As a user I want to login");
        saved.setSession(session);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findBySessionOrderByOrderIndex(session)).thenReturn(List.of());
        when(storyRepository.save(any(Story.class))).thenReturn(saved);

        Story result = storyService.createStory("SES001", request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getTitle()).isEqualTo("As a user I want to login");
        verify(storyRepository).save(any(Story.class));
    }

    @Test
    void createStory_orderIndexIsSetToCurrentListSize() {
        CreateStoryRequest request = new CreateStoryRequest();
        request.setTitle("Story 3");

        Story existingStory1 = new Story();
        Story existingStory2 = new Story();

        Story saved = new Story();
        saved.setId(3L);
        saved.setOrderIndex(2);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findBySessionOrderByOrderIndex(session))
                .thenReturn(List.of(existingStory1, existingStory2));
        when(storyRepository.save(any(Story.class))).thenAnswer(inv -> {
            Story s = inv.getArgument(0);
            assertThat(s.getOrderIndex()).isEqualTo(2);
            return saved;
        });

        storyService.createStory("SES001", request);
    }

    // ─── getStories ──────────────────────────────────────────────────────────────

    @Test
    void getStories_noStatus_returnsAllStories() {
        Story s1 = new Story(); s1.setId(1L);
        Story s2 = new Story(); s2.setId(2L);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findBySessionOrderByOrderIndex(session)).thenReturn(List.of(s1, s2));

        List<Story> result = storyService.getStories("SES001", null);

        assertThat(result).hasSize(2);
    }

    @Test
    void getStories_withStatus_filtersStories() {
        Story completedStory = new Story();
        completedStory.setId(5L);
        completedStory.setStatus(StoryStatus.COMPLETED);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findBySessionAndStatusOrderByOrderIndex(session, StoryStatus.COMPLETED))
                .thenReturn(List.of(completedStory));

        List<Story> result = storyService.getStories("SES001", StoryStatus.COMPLETED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(StoryStatus.COMPLETED);
    }

    // ─── getStoriesPage ───────────────────────────────────────────────────────────

    @Test
    void getStoriesPage_noStatus_returnsPagedStories() {
        Story s1 = new Story(); s1.setId(1L);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Story> page = new PageImpl<>(List.of(s1), pageable, 1);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findBySessionOrderByOrderIndex(session, pageable)).thenReturn(page);

        Page<Story> result = storyService.getStoriesPage("SES001", null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // ─── deleteStory ─────────────────────────────────────────────────────────────

    @Test
    void deleteStory_existingStory_deletesIt() {
        Story story = new Story();
        story.setId(7L);
        story.setSession(session);

        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findById(7L)).thenReturn(Optional.of(story));
        doNothing().when(sessionAccessValidator).requireStoryBelongsToSession(story, session);

        storyService.deleteStory("SES001", 7L);

        verify(storyRepository).delete(story);
    }

    @Test
    void deleteStory_nonExistentStory_throwsStoryNotFoundException() {
        when(sessionService.getSession("SES001")).thenReturn(session);
        when(storyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> storyService.deleteStory("SES001", 99L))
                .isInstanceOf(StoryNotFoundException.class);
    }
}
