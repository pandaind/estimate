package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.UpdateUserRequest;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.service.interfaces.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionCode}/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Session participant management")
public class UserController {

    private final IUserService userService;

    @GetMapping
    @Operation(summary = "Get active users", description = "List all participants in the session")
    public ResponseEntity<List<User>> getActiveUsers(
            @PathVariable String sessionCode,
            @RequestParam(defaultValue = "true") Boolean activeOnly) {
        List<User> users = userService.getActiveUsers(sessionCode, activeOnly);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user details")
    public ResponseEntity<User> getUser(
            @PathVariable String sessionCode,
            @PathVariable Long userId) {
        User user = userService.getUser(sessionCode, userId);
        return ResponseEntity.ok(user);
    }

    @PreAuthorize("@sessionAccessValidator.isCallerOrModerator(#userId)")
    @PutMapping("/{userId}")
    @Operation(summary = "Update user profile")
    public ResponseEntity<User> updateUser(
            @PathVariable String sessionCode,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request) {
        User user = userService.updateUser(sessionCode, userId, request);
        return ResponseEntity.ok(user);
    }
}
