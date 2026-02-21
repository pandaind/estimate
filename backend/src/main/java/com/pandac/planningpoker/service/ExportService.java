package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.SessionExportDTO;
import com.pandac.planningpoker.dto.SessionImportDTO;
import com.pandac.planningpoker.exception.ResourceNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExportService {
    
    private final SessionRepository sessionRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();
    
    /**
     * Export complete session data in JSON format
     */
    @Transactional(readOnly = true)
    public SessionExportDTO exportSessionAsJson(String sessionCode) {
        Session session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionCode));
        
        List<Story> stories = storyRepository.findBySessionOrderByOrderIndex(session);
        List<User> users = userRepository.findBySession(session);
        
        // Get all votes for all stories
        List<Vote> allVotes = stories.stream()
                .flatMap(story -> voteRepository.findByStory(story).stream())
                .collect(Collectors.toList());
        
        SessionExportDTO export = new SessionExportDTO();
        export.setSession(session);
        export.setStories(stories);
        export.setUsers(users);
        export.setVotes(allVotes);
        export.setExportedAt(LocalDateTime.now());
        
        return export;
    }
    
    /**
     * Export session data as CSV format
     */
    @Transactional(readOnly = true)
    public String exportSessionAsCsv(String sessionCode) {
        Session session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionCode));
        
        List<Story> stories = storyRepository.findBySessionOrderByOrderIndex(session);
        
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Story Title,Description,Priority,Status,Final Estimate,Vote Count,Tags\n");
        
        // Data rows
        for (Story story : stories) {
            List<Vote> votes = voteRepository.findByStory(story);
            
            csv.append(escapeCsv(story.getTitle())).append(",");
            csv.append(escapeCsv(story.getDescription())).append(",");
            csv.append(story.getPriority() != null ? story.getPriority().name() : "").append(",");
            csv.append(story.getStatus() != null ? story.getStatus().name() : "").append(",");
            csv.append(escapeCsv(story.getFinalEstimate())).append(",");
            csv.append(votes.size()).append(",");
            csv.append(story.getTags() != null ? escapeCsv(String.join(";", story.getTags())) : "");
            csv.append("\n");
        }
        
        return csv.toString();
    }
    
    /**
     * Import session from exported data
     */
    public Session importSession(SessionImportDTO importRequest) {
        SessionExportDTO sessionData = importRequest.getSessionData();
        
        // Create new session from imported data
        Session originalSession = sessionData.getSession();
        Session newSession = new Session();
        
        // Generate new code or keep original
        if (importRequest.getGenerateNewCode() != null && importRequest.getGenerateNewCode()) {
            newSession.setSessionCode(generateUniqueSessionCode());
        } else {
            newSession.setSessionCode(originalSession.getSessionCode());
        }
        
        newSession.setName(originalSession.getName());
        newSession.setDescription(originalSession.getDescription());
        newSession.setSizingMethod(originalSession.getSizingMethod());
        newSession.setCustomValues(originalSession.getCustomValues());
        // Copy embedded settings (one line instead of six)
        SessionSettings src = originalSession.getSettings();
        newSession.setSettings(new SessionSettings(
                src.getAutoReveal(), src.getTimerEnabled(), src.getTimerDuration(),
                src.getAllowChangeVote(), src.getAllowObservers(), src.getRequireConfidence()));
        newSession.setVotesRevealed(false); // Reset voting state
        newSession.setIsActive(true);
        
        Session savedSession = sessionRepository.save(newSession);
        
        // Import users
        for (User originalUser : sessionData.getUsers()) {
            User newUser = new User();
            newUser.setName(originalUser.getName());
            newUser.setAvatar(originalUser.getAvatar());
            newUser.setIsObserver(originalUser.getIsObserver());
            newUser.setIsModerator(originalUser.getIsModerator());
            newUser.setIsActive(true);
            newUser.setSession(savedSession);
            userRepository.save(newUser);
        }
        
        // Import stories
        for (Story originalStory : sessionData.getStories()) {
            Story newStory = new Story();
            newStory.setTitle(originalStory.getTitle());
            newStory.setDescription(originalStory.getDescription());
            newStory.setAcceptanceCriteria(originalStory.getAcceptanceCriteria());
            newStory.setTags(originalStory.getTags());
            newStory.setPriority(originalStory.getPriority());
            newStory.setStatus(StoryStatus.NOT_ESTIMATED); // Reset status
            newStory.setOrderIndex(originalStory.getOrderIndex());
            newStory.setFinalEstimate(null); // Clear estimates for new voting
            newStory.setEstimateNotes(null);
            newStory.setSession(savedSession);
            storyRepository.save(newStory);
        }
        
        // Note: Votes are NOT imported - each new session starts fresh
        
        return savedSession;
    }
    
    private String generateUniqueSessionCode() {
        String code;
        do {
            code = generateRandomCode();
        } while (sessionRepository.findBySessionCode(code).isPresent());
        return code;
    }
    
    private String generateRandomCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return code.toString();
    }
    
    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
