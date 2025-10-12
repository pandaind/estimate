package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.service.PlanningPokerService;
import com.pandac.planningpoker.service.AnalyticsService;
import com.pandac.planningpoker.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Planning Poker", description = "Planning Poker session management and voting APIs")
public class PlanningPokerController {
    
    private final PlanningPokerService planningPokerService;
    private final AnalyticsService analyticsService;
    private final ExportService exportService;
    
    // ==================== SESSION ENDPOINTS ====================
    
    @PostMapping("/sessions")
    @Operation(summary = "Create a new planning poker session", 
               description = "Creates a new session with a unique 6-character code")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Session created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<CreateSessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        CreateSessionResponse response = planningPokerService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/sessions/{sessionCode}")
    @Operation(summary = "Get session details",
               description = "Retrieve full session information including participants and settings")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Session found"),
        @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<Session> getSession(
            @Parameter(description = "6-character session code", required = true)
            @PathVariable String sessionCode) {
        Session session = planningPokerService.getSession(sessionCode);
        return ResponseEntity.ok(session);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PutMapping("/sessions/{sessionCode}")
    @Operation(summary = "Update session settings",
               description = "Update session configuration (moderator only)")
    public ResponseEntity<Session> updateSession(
            @PathVariable String sessionCode,
            @Valid @RequestBody UpdateSessionRequest request) {
        Session session = planningPokerService.updateSession(sessionCode, request);
        return ResponseEntity.ok(session);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @DeleteMapping("/sessions/{sessionCode}")
    @Operation(summary = "End/delete session",
               description = "Terminates the session (moderator only)")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionCode) {
        planningPokerService.deleteSession(sessionCode);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/sessions/{sessionCode}/join")
    @Operation(summary = "Join a session",
               description = "Add a participant to an active session")
    public ResponseEntity<UserSession> joinSession(
            @PathVariable String sessionCode,
            @Valid @RequestBody JoinSessionRequest request) {
        UserSession userSession = planningPokerService.joinSession(sessionCode, request);
        return ResponseEntity.ok(userSession);
    }
    
    @PostMapping("/sessions/{sessionCode}/users/{userId}/leave")
    @Operation(summary = "Leave a session",
               description = "Remove user from active participants")
    public ResponseEntity<Void> leaveSession(
            @PathVariable String sessionCode,
            @PathVariable Long userId) {
        planningPokerService.leaveSession(sessionCode, userId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/sessions/{sessionCode}/users")
    @Operation(summary = "Get active users",
               description = "List all participants in the session")
    public ResponseEntity<List<User>> getActiveUsers(
            @PathVariable String sessionCode,
            @RequestParam(defaultValue = "true") Boolean activeOnly) {
        List<User> users = planningPokerService.getActiveUsers(sessionCode, activeOnly);
        return ResponseEntity.ok(users);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/current-story")
    @Operation(summary = "Set current story for voting",
               description = "Change the active story being estimated")
    public ResponseEntity<Session> setCurrentStory(
            @PathVariable String sessionCode,
            @RequestParam Long storyId) {
        Session session = planningPokerService.setCurrentStory(sessionCode, storyId);
        return ResponseEntity.ok(session);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/reveal")
    @Operation(summary = "Reveal all votes",
               description = "Reveal all votes for the current story")
    public ResponseEntity<VoteReveal> revealVotes(@PathVariable String sessionCode) {
        VoteReveal reveal = planningPokerService.revealVotes(sessionCode);
        return ResponseEntity.ok(reveal);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/reset-votes")
    @Operation(summary = "Reset votes for current story",
               description = "Clear all votes to start a new round")
    public ResponseEntity<Void> resetVotes(@PathVariable String sessionCode) {
        planningPokerService.resetVotes(sessionCode);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== STORY ENDPOINTS ====================
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/stories")
    @Operation(summary = "Create a new story",
               description = "Add a story to the backlog")
    public ResponseEntity<Story> createStory(
            @PathVariable String sessionCode,
            @Valid @RequestBody CreateStoryRequest request) {
        Story story = planningPokerService.createStory(sessionCode, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(story);
    }
    
    @GetMapping("/sessions/{sessionCode}/stories")
    @Operation(summary = "List all stories",
               description = "Get all stories in the session backlog")
    public ResponseEntity<List<Story>> getStories(
            @PathVariable String sessionCode,
            @RequestParam(required = false) StoryStatus status) {
        List<Story> stories = planningPokerService.getStories(sessionCode, status);
        return ResponseEntity.ok(stories);
    }
    
    @GetMapping("/sessions/{sessionCode}/stories/{storyId}")
    @Operation(summary = "Get story details")
    public ResponseEntity<Story> getStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        Story story = planningPokerService.getStory(sessionCode, storyId);
        return ResponseEntity.ok(story);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PutMapping("/sessions/{sessionCode}/stories/{storyId}")
    @Operation(summary = "Update story")
    public ResponseEntity<Story> updateStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody UpdateStoryRequest request) {
        Story story = planningPokerService.updateStory(sessionCode, storyId, request);
        return ResponseEntity.ok(story);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @DeleteMapping("/sessions/{sessionCode}/stories/{storyId}")
    @Operation(summary = "Delete story")
    public ResponseEntity<Void> deleteStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        planningPokerService.deleteStory(sessionCode, storyId);
        return ResponseEntity.noContent().build();
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/stories/{storyId}/finalize")
    @Operation(summary = "Finalize story estimate",
               description = "Set the final agreed estimate for a story")
    public ResponseEntity<Story> finalizeEstimate(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody FinalizeEstimateRequest request) {
        Story story = planningPokerService.finalizeEstimate(sessionCode, storyId, request.getFinalEstimate(), request.getNotes());
        return ResponseEntity.ok(story);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/sessions/{sessionCode}/stories/{storyId}/reset")
    @Operation(summary = "Reset story for revoting",
               description = "Clear estimate and votes to allow revoting on a story")
    public ResponseEntity<Story> resetStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        Story story = planningPokerService.resetStory(sessionCode, storyId);
        return ResponseEntity.ok(story);
    }
    
    // ==================== VOTING ENDPOINTS ====================
    
    @PostMapping("/sessions/{sessionCode}/stories/{storyId}/votes")
    @Operation(summary = "Cast or update vote",
               description = "Submit an estimate for a story")
    public ResponseEntity<Vote> castVote(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody VoteRequest request) {
        Vote vote = planningPokerService.castVote(sessionCode, storyId, request.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(vote);
    }
    
    @GetMapping("/sessions/{sessionCode}/stories/{storyId}/votes")
    @Operation(summary = "Get votes for a story")
    public ResponseEntity<List<VoteResponse>> getVotes(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @RequestParam(defaultValue = "false") Boolean revealed) {
        List<VoteResponse> votes = planningPokerService.getVotes(sessionCode, storyId, revealed);
        return ResponseEntity.ok(votes);
    }
    
    @DeleteMapping("/sessions/{sessionCode}/stories/{storyId}/votes/{userId}")
    @Operation(summary = "Remove vote",
               description = "Delete a user's vote for a story")
    public ResponseEntity<Void> deleteVote(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @PathVariable Long userId) {
        planningPokerService.deleteVote(sessionCode, storyId, userId);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== USER ENDPOINTS ====================
    
    @GetMapping("/sessions/{sessionCode}/users/{userId}")
    @Operation(summary = "Get user details")
    public ResponseEntity<User> getUser(
            @PathVariable String sessionCode,
            @PathVariable Long userId) {
        User user = planningPokerService.getUser(sessionCode, userId);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/sessions/{sessionCode}/users/{userId}")
    @Operation(summary = "Update user profile")
    public ResponseEntity<User> updateUser(
            @PathVariable String sessionCode,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request) {
        User user = planningPokerService.updateUser(sessionCode, userId, request);
        return ResponseEntity.ok(user);
    }
    
    // ==================== ANALYTICS ENDPOINTS ====================
    
    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/sessions/{sessionCode}/analytics")
    @Operation(summary = "Get session analytics",
               description = "Retrieve insights and metrics for the session")
    public ResponseEntity<SessionAnalyticsDTO> getSessionAnalytics(@PathVariable String sessionCode) {
        SessionAnalyticsDTO analytics = analyticsService.getSessionAnalytics(sessionCode);
        return ResponseEntity.ok(analytics);
    }
    
    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/sessions/{sessionCode}/stories/{storyId}/analytics")
    @Operation(summary = "Get story voting analytics",
               description = "Detailed analytics for a specific story's votes")
    public ResponseEntity<StoryAnalyticsDTO> getStoryAnalytics(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        StoryAnalyticsDTO analytics = analyticsService.getStoryAnalytics(sessionCode, storyId);
        return ResponseEntity.ok(analytics);
    }
    
    // ==================== EXPORT/IMPORT ENDPOINTS ====================
    
    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/sessions/{sessionCode}/export")
    @Operation(summary = "Export session data",
               description = "Export complete session including stories and votes")
    public ResponseEntity<?> exportSession(
            @PathVariable String sessionCode,
            @RequestParam(defaultValue = "json") String format) {
        
        if ("csv".equalsIgnoreCase(format)) {
            String csv = exportService.exportSessionAsCsv(sessionCode);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .header("Content-Disposition", "attachment; filename=session-" + sessionCode + ".csv")
                    .body(csv);
        } else {
            // Default to JSON
            SessionExportDTO export = exportService.exportSessionAsJson(sessionCode);
            return ResponseEntity.ok(export);
        }
    }
    
    @PostMapping("/sessions/import")
    @Operation(summary = "Import session data",
               description = "Create a session from exported data")
    public ResponseEntity<Session> importSession(@Valid @RequestBody SessionImportDTO importRequest) {
        Session session = exportService.importSession(importRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }
    
    // ==================== UTILITY ENDPOINTS ====================
    
    @GetMapping("/sizing-methods")
    @Operation(summary = "Get available sizing methods",
               description = "List all supported estimation scales")
    public ResponseEntity<SizingMethod[]> getSizingMethods() {
        return ResponseEntity.ok(SizingMethod.values());
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check",
               description = "API health status")
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(new java.util.HashMap<String, Object>() {{
            put("status", "UP");
            put("timestamp", java.time.LocalDateTime.now());
        }});
    }
}
