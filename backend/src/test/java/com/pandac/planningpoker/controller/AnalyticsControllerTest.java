package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.SessionAnalyticsDTO;
import com.pandac.planningpoker.dto.StoryAnalyticsDTO;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AnalyticsControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean AnalyticsService analyticsService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    @Test
    @WithMockUser(roles = "MODERATOR")
    void getSessionAnalytics_asModerator_returns200() throws Exception {
        SessionAnalyticsDTO analytics = new SessionAnalyticsDTO();
        analytics.setSessionCode("ABC123");
        analytics.setTotalStories(5);
        when(analyticsService.getSessionAnalytics("ABC123")).thenReturn(analytics);

        mockMvc.perform(get("/api/sessions/ABC123/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStories").value(5));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getSessionAnalytics_asParticipant_returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/ABC123/analytics"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSessionAnalytics_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/ABC123/analytics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "MODERATOR")
    void getStoryAnalytics_asModerator_returns200() throws Exception {
        StoryAnalyticsDTO analytics = new StoryAnalyticsDTO();
        analytics.setStoryId(1L);
        analytics.setVoteCount(3);
        when(analyticsService.getStoryAnalytics("ABC123", 1L)).thenReturn(analytics);

        mockMvc.perform(get("/api/sessions/ABC123/stories/1/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.voteCount").value(3));
    }
}
