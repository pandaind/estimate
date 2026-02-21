package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.StoryStatus;
import com.pandac.planningpoker.service.interfaces.IStoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionCode}/stories")
@RequiredArgsConstructor
@Tag(name = "Stories", description = "Story backlog management and finalization")
public class StoryController {

    private final IStoryService storyService;

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping
    @Operation(summary = "Create a new story", description = "Add a story to the backlog")
    public ResponseEntity<Story> createStory(
            @PathVariable String sessionCode,
            @Valid @RequestBody CreateStoryRequest request) {
        Story story = storyService.createStory(sessionCode, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(story);
    }

    @GetMapping
    @Operation(summary = "List all stories", description = "Get all stories in the session backlog")
    public ResponseEntity<List<Story>> getStories(
            @PathVariable String sessionCode,
            @RequestParam(required = false) StoryStatus status) {
        List<Story> stories = storyService.getStories(sessionCode, status);
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/{storyId}")
    @Operation(summary = "Get story details")
    public ResponseEntity<Story> getStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        Story story = storyService.getStory(sessionCode, storyId);
        return ResponseEntity.ok(story);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PutMapping("/{storyId}")
    @Operation(summary = "Update story")
    public ResponseEntity<Story> updateStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody UpdateStoryRequest request) {
        Story story = storyService.updateStory(sessionCode, storyId, request);
        return ResponseEntity.ok(story);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @DeleteMapping("/{storyId}")
    @Operation(summary = "Delete story")
    public ResponseEntity<Void> deleteStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        storyService.deleteStory(sessionCode, storyId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/{storyId}/finalize")
    @Operation(summary = "Finalize story estimate",
               description = "Set the final agreed estimate for a story")
    public ResponseEntity<Story> finalizeEstimate(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody FinalizeEstimateRequest request) {
        Story story = storyService.finalizeEstimate(sessionCode, storyId, request.getFinalEstimate(), request.getNotes());
        return ResponseEntity.ok(story);
    }

    @PreAuthorize("hasRole('MODERATOR')")
    @PostMapping("/{storyId}/reset")
    @Operation(summary = "Reset story for revoting",
               description = "Clear estimate and votes to allow revoting on a story")
    public ResponseEntity<Story> resetStory(
            @PathVariable String sessionCode,
            @PathVariable Long storyId) {
        Story story = storyService.resetStory(sessionCode, storyId);
        return ResponseEntity.ok(story);
    }
}
