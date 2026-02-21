package com.pandac.planningpoker.service;

import com.pandac.planningpoker.model.Story;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Centralises all WebSocket event publishing.
 * All topic paths and message shapes live here — changing a topic name is a one-line edit,
 * and service unit tests no longer need a SimpMessagingTemplate mock.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    // ── Generic dispatch ────────────────────────────────────────────────────────

    public void publish(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception e) {
            log.error("Failed to publish WebSocket event to {}: {}", destination, e.getMessage());
        }
    }

    // ── User events ────────────────────────────────────────────────────────────

    public void userJoined(String sessionCode, Long userId, String userName) {
        publish("/topic/session/" + sessionCode + "/users",
                Map.of("type", "USER_JOINED", "userId", userId, "userName", userName));
    }

    public void userLeft(String sessionCode, Long userId, String userName) {
        publish("/topic/session/" + sessionCode + "/users",
                Map.of("type", "USER_LEFT", "userId", userId, "userName", userName));
    }

    // ── Vote / reveal events ───────────────────────────────────────────────────

    public void voteCast(String sessionCode, Long storyId, int voteCount) {
        publish("/topic/session/" + sessionCode + "/votes",
                Map.of("type", "VOTE_CAST", "storyId", storyId, "voteCount", voteCount));
    }

    public void votesRevealed(String sessionCode, Long storyId) {
        publish("/topic/session/" + sessionCode + "/reveal",
                Map.of("type", "VOTES_REVEALED", "storyId", storyId, "sessionCode", sessionCode));
    }

    public void votesReset(String sessionCode, Long storyId) {
        publish("/topic/session/" + sessionCode + "/reveal",
                Map.of("type", "VOTES_RESET", "storyId", storyId, "sessionCode", sessionCode));
    }

    // ── Story events ───────────────────────────────────────────────────────────

    public void storyActivated(String sessionCode, Story story) {
        publish("/topic/session/" + sessionCode + "/story",
                Map.of("type", "STORY_ACTIVATED", "story", story));
    }

    public void storyFinalized(String sessionCode, Story story) {
        publish("/topic/session/" + sessionCode + "/story",
                Map.of("type", "STORY_FINALIZED", "story", story));
    }

    public void storyReset(String sessionCode, Story story) {
        publish("/topic/session/" + sessionCode + "/story",
                Map.of("type", "STORY_RESET", "story", story));
    }

    // ── Timer / session settings events ───────────────────────────────────────

    public void timerSettingsChanged(String sessionCode, Boolean timerEnabled, Integer timerDuration) {
        publish("/topic/session/" + sessionCode + "/timer",
                Map.of("type", "TIMER_SETTINGS_CHANGED",
                       "timerEnabled", timerEnabled,
                       "timerDuration", timerDuration));
    }
}
