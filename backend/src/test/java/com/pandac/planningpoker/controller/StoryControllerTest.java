package com.pandac.planningpoker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pandac.planningpoker.dto.CreateStoryRequest;
import com.pandac.planningpoker.dto.FinalizeEstimateRequest;
import com.pandac.planningpoker.dto.UpdateStoryRequest;
import com.pandac.planningpoker.exception.StoryNotFoundException;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.StoryStatus;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.IStoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StoryController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class StoryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean IStoryService storyService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    // ── createStory (MODERATOR only) ────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void createStory_asModerator_returns201() throws Exception {
        CreateStoryRequest request = new CreateStoryRequest();
        request.setTitle("Login Feature");

        Story story = new Story();
        story.setId(1L);
        story.setTitle("Login Feature");
        when(storyService.createStory(eq("ABC123"), any())).thenReturn(story);

        mockMvc.perform(post("/api/sessions/ABC123/stories")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Login Feature"));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void createStory_asParticipant_returns403() throws Exception {
        mockMvc.perform(post("/api/sessions/ABC123/stories")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    // ── getStories (authenticated) ──────────────────────────────────────────

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getStories_returnsStoriesList() throws Exception {
        Story s1 = new Story();
        s1.setId(1L);
        s1.setTitle("Story A");
        when(storyService.getStories(eq("ABC123"), isNull())).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/sessions/ABC123/stories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Story A"));
    }

    // ── getStory (authenticated) ────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getStory_returns200() throws Exception {
        Story story = new Story();
        story.setId(1L);
        story.setTitle("Story A");
        when(storyService.getStory("ABC123", 1L)).thenReturn(story);

        mockMvc.perform(get("/api/sessions/ABC123/stories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getStory_notFound_returns404() throws Exception {
        when(storyService.getStory("ABC123", 99L)).thenThrow(new StoryNotFoundException(99L));

        mockMvc.perform(get("/api/sessions/ABC123/stories/99"))
                .andExpect(status().isNotFound());
    }

    // ── deleteStory (MODERATOR only) ────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void deleteStory_asModerator_returns204() throws Exception {
        mockMvc.perform(delete("/api/sessions/ABC123/stories/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteStory_unauthenticated_returns403() throws Exception {
        mockMvc.perform(delete("/api/sessions/ABC123/stories/1"))
                .andExpect(status().isForbidden());
    }

    // ── finalizeEstimate (MODERATOR only) ───────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void finalizeEstimate_asModerator_returns200() throws Exception {
        FinalizeEstimateRequest request = new FinalizeEstimateRequest();
        request.setFinalEstimate("8");

        Story story = new Story();
        story.setId(1L);
        story.setFinalEstimate("8");
        when(storyService.finalizeEstimate(eq("ABC123"), eq(1L), eq("8"), any())).thenReturn(story);

        mockMvc.perform(post("/api/sessions/ABC123/stories/1/finalize")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.finalEstimate").value("8"));
    }

    // ── resetStory (MODERATOR only) ─────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void resetStory_asModerator_returns200() throws Exception {
        Story story = new Story();
        story.setId(1L);
        story.setStatus(StoryStatus.NOT_ESTIMATED);
        when(storyService.resetStory("ABC123", 1L)).thenReturn(story);

        mockMvc.perform(post("/api/sessions/ABC123/stories/1/reset"))
                .andExpect(status().isOk());
    }
}
