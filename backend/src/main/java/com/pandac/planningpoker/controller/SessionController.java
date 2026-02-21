package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Planning Poker session lifecycle management")
public class SessionController {

    private final ISessionService sessionService;

    @PostMapping
    @Operation(summary = "Create a new planning poker session",
               description = "Creates a new session with a unique 6-character code")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Session created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<CreateSessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        CreateSessionResponse response = sessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{sessionCode}")
    @Operation(summary = "Get session details",
               description = "Retrieve full session information including participants and settings")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Session found"),
        @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<Session> getSession(
            @Parameter(description = "6-character session code", required = true)
            @PathVariable String sessionCode) {
        Session session = sessionService.getSession(sessionCode);
        return ResponseEntity.ok(session);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PutMapping("/{sessionCode}")
    @Operation(summary = "Update session settings",
               description = "Update session configuration (moderator only)")
    public ResponseEntity<Session> updateSession(
            @PathVariable String sessionCode,
            @Valid @RequestBody UpdateSessionRequest request) {
        Session session = sessionService.updateSession(sessionCode, request);
        return ResponseEntity.ok(session);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @DeleteMapping("/{sessionCode}")
    @Operation(summary = "End/delete session",
               description = "Terminates the session (moderator only)")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionCode) {
        sessionService.deleteSession(sessionCode);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sessionCode}/join")
    @Operation(summary = "Join a session",
               description = "Add a participant to an active session")
    public ResponseEntity<UserSession> joinSession(
            @PathVariable String sessionCode,
            @Valid @RequestBody JoinSessionRequest request) {
        UserSession userSession = sessionService.joinSession(sessionCode, request);
        return ResponseEntity.ok(userSession);
    }

    @PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")
    @PostMapping("/{sessionCode}/users/{userId}/leave")
    @Operation(summary = "Leave a session",
               description = "Remove user from active participants")
    public ResponseEntity<Void> leaveSession(
            @PathVariable String sessionCode,
            @PathVariable Long userId) {
        sessionService.leaveSession(sessionCode, userId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/{sessionCode}/current-story")
    @Operation(summary = "Set current story for voting",
               description = "Change the active story being estimated")
    public ResponseEntity<Session> setCurrentStory(
            @PathVariable String sessionCode,
            @RequestParam Long storyId) {
        Session session = sessionService.setCurrentStory(sessionCode, storyId);
        return ResponseEntity.ok(session);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/{sessionCode}/reveal")
    @Operation(summary = "Reveal all votes",
               description = "Reveal all votes for the current story")
    public ResponseEntity<VoteReveal> revealVotes(@PathVariable String sessionCode) {
        VoteReveal reveal = sessionService.revealVotes(sessionCode);
        return ResponseEntity.ok(reveal);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/{sessionCode}/reset-votes")
    @Operation(summary = "Reset votes for current story",
               description = "Clear all votes to start a new round")
    public ResponseEntity<Void> resetVotes(@PathVariable String sessionCode) {
        sessionService.resetVotes(sessionCode);
        return ResponseEntity.noContent().build();
    }
}
