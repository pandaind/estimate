package com.pandac.planningpoker.controller;

import com.pandac.planningpoker.dto.SessionExportDTO;
import com.pandac.planningpoker.dto.SessionImportDTO;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.SizingMethod;
import com.pandac.planningpoker.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Export / Utility", description = "Session export, import, and utility endpoints")
public class ExportController {

    private final ExportService exportService;

    @PreAuthorize("hasRole('MODERATOR')")
    @GetMapping("/api/sessions/{sessionCode}/export")
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
        }
        SessionExportDTO export = exportService.exportSessionAsJson(sessionCode);
        return ResponseEntity.ok(export);
    }

    @PostMapping("/api/sessions/import")
    @Operation(summary = "Import session data",
               description = "Create a session from exported data")
    public ResponseEntity<Session> importSession(@Valid @RequestBody SessionImportDTO importRequest) {
        Session session = exportService.importSession(importRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @GetMapping("/api/sizing-methods")
    @Operation(summary = "Get available sizing methods",
               description = "List all supported estimation scales")
    public ResponseEntity<SizingMethod[]> getSizingMethods() {
        return ResponseEntity.ok(SizingMethod.values());
    }

    @GetMapping("/api/health")
    @Operation(summary = "Health check", description = "API health status")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }
}
