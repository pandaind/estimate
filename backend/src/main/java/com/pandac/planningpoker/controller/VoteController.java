package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Vote;
import com.pandac.planningpoker.service.interfaces.IVoteService;
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
@RequestMapping("/api/sessions/{sessionCode}/stories/{storyId}/votes")
@RequiredArgsConstructor
@Tag(name = "Votes", description = "Vote casting and retrieval")
public class VoteController {

    private final IVoteService voteService;

    @PostMapping
    @Operation(summary = "Cast or update vote", description = "Submit an estimate for a story")
    public ResponseEntity<Vote> castVote(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @Valid @RequestBody VoteRequest request) {
        Vote vote = voteService.castVote(sessionCode, storyId, request.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(vote);
    }

    @GetMapping
    @Operation(summary = "Get votes for a story")
    public ResponseEntity<List<VoteResponse>> getVotes(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @RequestParam(defaultValue = "false") Boolean revealed) {
        List<VoteResponse> votes = voteService.getVotes(sessionCode, storyId, revealed);
        return ResponseEntity.ok(votes);
    }

    @PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")
    @DeleteMapping("/{userId}")
    @Operation(summary = "Remove vote", description = "Delete a user's vote for a story")
    public ResponseEntity<Void> deleteVote(
            @PathVariable String sessionCode,
            @PathVariable Long storyId,
            @PathVariable Long userId) {
        voteService.deleteVote(sessionCode, storyId, userId);
        return ResponseEntity.noContent().build();
    }
}
