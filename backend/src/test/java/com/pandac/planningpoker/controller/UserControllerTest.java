package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.exception.UserNotFoundException;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.security.JwtAuthenticationFilter;
import com.pandac.planningpoker.security.JwtTokenService;
import com.pandac.planningpoker.security.SecurityConfig;
import com.pandac.planningpoker.security.SessionAccessValidator;
import com.pandac.planningpoker.service.interfaces.IUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class UserControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean IUserService userService;
    @MockBean JwtTokenService jwtTokenService;
    @MockBean SessionAccessValidator sessionAccessValidator;

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getActiveUsers_returns200() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        when(userService.getActiveUsers("ABC123", true)).thenReturn(List.of(user));

        mockMvc.perform(get("/api/sessions/ABC123/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Alice"));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getUser_returns200() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        when(userService.getUser("ABC123", 1L)).thenReturn(user);

        mockMvc.perform(get("/api/sessions/ABC123/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    @WithMockUser(roles = "PARTICIPANT")
    void getUser_notFound_returns404() throws Exception {
        when(userService.getUser("ABC123", 99L)).thenThrow(new UserNotFoundException(99L));

        mockMvc.perform(get("/api/sessions/ABC123/users/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getUsers_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/ABC123/users"))
                .andExpect(status().isForbidden());
    }
}
