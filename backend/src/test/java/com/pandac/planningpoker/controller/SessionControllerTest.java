package com.pandac.planningpoker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.exception.SessionNotFoundException;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.SizingMethod;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SessionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ISessionService sessionService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    // ── createSession (public) ──────────────────────────────────────────────

    @Test
    void createSession_returns201() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("Sprint 1");
        request.setSizingMethod(SizingMethod.FIBONACCI);
        request.setModeratorName("Alice");

        CreateSessionResponse response = new CreateSessionResponse();
        response.setToken("jwt-token");
        Session s = new Session();
        s.setSessionCode("ABC123");
        response.setSession(s);

        when(sessionService.createSession(any())).thenReturn(response);

        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    // ── getSession (public) ─────────────────────────────────────────────────

    @Test
    void getSession_returns200() throws Exception {
        Session session = new Session();
        session.setSessionCode("ABC123");
        session.setName("Test");
        when(sessionService.getSession("ABC123")).thenReturn(session);

        mockMvc.perform(get("/api/sessions/ABC123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionCode").value("ABC123"));
    }

    @Test
    void getSession_unknownCode_returns404() throws Exception {
        when(sessionService.getSession("XXXXXX")).thenThrow(new SessionNotFoundException("XXXXXX"));

        mockMvc.perform(get("/api/sessions/XXXXXX"))
                .andExpect(status().isNotFound());
    }

    // ── updateSession (MODERATOR only) ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void updateSession_asModerator_returns200() throws Exception {
        UpdateSessionRequest request = new UpdateSessionRequest();
        request.setName("Updated Sprint");

        Session updated = new Session();
        updated.setSessionCode("ABC123");
        updated.setName("Updated Sprint");
        when(sessionService.updateSession(eq("ABC123"), any())).thenReturn(updated);

        mockMvc.perform(put("/api/sessions/ABC123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Sprint"));
    }

    @Test
    void updateSession_unauthenticated_returns403() throws Exception {
        mockMvc.perform(put("/api/sessions/ABC123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void updateSession_asParticipant_returns403() throws Exception {
        mockMvc.perform(put("/api/sessions/ABC123")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    // ── deleteSession (MODERATOR only) ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void deleteSession_asModerator_returns204() throws Exception {
        mockMvc.perform(delete("/api/sessions/ABC123"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteSession_unauthenticated_returns403() throws Exception {
        mockMvc.perform(delete("/api/sessions/ABC123"))
                .andExpect(status().isForbidden());
    }

    // ── joinSession (public) ────────────────────────────────────────────────

    @Test
    void joinSession_returns200() throws Exception {
        JoinSessionRequest request = new JoinSessionRequest();
        request.setName("Bob");

        UserSession us = new UserSession();
        us.setToken("join-token");
        when(sessionService.joinSession(eq("ABC123"), any())).thenReturn(us);

        mockMvc.perform(post("/api/sessions/ABC123/join")
                        
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("join-token"));
    }

    // ── revealVotes (MODERATOR only) ────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void revealVotes_asModerator_returns200() throws Exception {
        VoteReveal reveal = new VoteReveal();
        reveal.setStoryId(1L);
        when(sessionService.revealVotes("ABC123")).thenReturn(reveal);

        mockMvc.perform(post("/api/sessions/ABC123/reveal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storyId").value(1));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void revealVotes_asParticipant_returns403() throws Exception {
        mockMvc.perform(post("/api/sessions/ABC123/reveal"))
                .andExpect(status().isForbidden());
    }

    // ── resetVotes (MODERATOR only) ─────────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void resetVotes_asModerator_returns204() throws Exception {
        mockMvc.perform(post("/api/sessions/ABC123/reset-votes"))
                .andExpect(status().isNoContent());
    }

    @Test
    void resetVotes_unauthenticated_returns403() throws Exception {
        mockMvc.perform(post("/api/sessions/ABC123/reset-votes"))
                .andExpect(status().isForbidden());
    }
}
