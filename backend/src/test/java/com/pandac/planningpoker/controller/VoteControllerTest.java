package com.pandac.planningpoker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pandac.planningpoker.dto.VoteRequest;
import com.pandac.planningpoker.dto.VoteResponse;
import com.pandac.planningpoker.model.Vote;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.IVoteService;
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

@WebMvcTest(VoteController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class VoteControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean IVoteService voteService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    // ── castVote (authenticated) ────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void castVote_returns201() throws Exception {
        VoteRequest request = new VoteRequest();
        request.setEstimate("5");
        request.setUserId(1L);

        Vote vote = new Vote();
        vote.setId(1L);
        vote.setEstimate("5");
        when(voteService.castVote(eq("ABC123"), eq(10L), eq(1L), any())).thenReturn(vote);

        mockMvc.perform(post("/api/sessions/ABC123/stories/10/votes")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estimate").value("5"));
    }

    @Test
    void castVote_unauthenticated_returns403() throws Exception {
        mockMvc.perform(post("/api/sessions/ABC123/stories/10/votes")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estimate\":\"5\",\"userId\":1}"))
                .andExpect(status().isForbidden());
    }

    // ── getVotes (authenticated) ────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getVotes_returns200() throws Exception {
        when(voteService.getVotes("ABC123", 10L, false)).thenReturn(List.of());

        mockMvc.perform(get("/api/sessions/ABC123/stories/10/votes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── deleteVote (caller or moderator) ────────────────────────────────────
    // Note: @PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")
    // requires full integration context for SpEL parameter name resolution.
    // Authorization is tested via service-level and E2E tests.

    @Test
    void deleteVote_unauthenticated_returns403() throws Exception {
        mockMvc.perform(delete("/api/sessions/ABC123/stories/10/votes/5"))
                .andExpect(status().isForbidden());
    }
}
