package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.model.SizingMethod;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.ExportService;
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

@WebMvcTest(ExportController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ExportControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean ExportService exportService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    // ── healthCheck (public) ────────────────────────────────────────────────

    @Test
    void healthCheck_returns200() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // ── getSizingMethods (public) ───────────────────────────────────────────

    @Test
    void getSizingMethods_returns200() throws Exception {
        mockMvc.perform(get("/api/sizing-methods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── exportSession (MODERATOR only) ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "MODERATOR")
    void exportSession_csv_returns200() throws Exception {
        when(exportService.exportSessionAsCsv("ABC123")).thenReturn("title,estimate\nStory1,5");

        mockMvc.perform(get("/api/sessions/ABC123/export").param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void exportSession_asParticipant_returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/ABC123/export"))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportSession_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/ABC123/export"))
                .andExpect(status().isForbidden());
    }
}
