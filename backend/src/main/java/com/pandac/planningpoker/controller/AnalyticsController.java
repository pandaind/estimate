package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.SessionAnalyticsDTO;
import com.pandac.planningpoker.dto.StoryAnalyticsDTO;
import com.pandac.planningpoker.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Session and story voting analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/{sessionCode}/analytics")
    @Operation(summary = "Get session analytics",
               description = "Retrieve insights and metrics for the session")
    public ResponseEntity<SessionAnalyticsDTO> getSessionAnalytics(@PathVariable String sessionCode) {
        SessionAnalyticsDTO analytics = analyticsService.getSessionAnalytics(sessionCode);
        return ResponseEntity.ok(analytics);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/{sessionCode}/stories/{storyId}/analytics")
    @Operation(summary = "Get story voting analytics",
               description = "Detailed analytics for a specific story's votes")
    public ResponseEntity<StoryAnalyticsDTO> getStoryAnalytics(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        StoryAnalyticsDTO analytics = analyticsService.getStoryAnalytics(sessionCode, storyId);
        return ResponseEntity.ok(analytics);
    }
}
