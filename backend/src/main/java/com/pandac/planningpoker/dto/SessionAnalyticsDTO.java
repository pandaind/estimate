package com.pandac.planningpoker.dto;

import lombok.Data;
import java.util.List;

@Data
public class SessionAnalyticsDTO {
    private String sessionCode;
    private Integer duration; // in minutes
    private Integer totalStories;
    private Integer estimatedStories;
    private Integer completedStories;
    private Integer inProgressStories;
    private Integer totalVotes;
    private Integer participantCount;
    private Double averageVotingTime;
    private Double consensusRate; // as percentage 0-100
    private VelocityMetrics velocityMetrics;
    private List<ParticipantActivity> participantActivity;
    
    @Data
    public static class VelocityMetrics {
        private Double totalStoryPoints;
        private Double averageStoryPoints;
        private Double storiesPerHour;
        private Double averageTimePerStory; // in seconds
    }
    
    @Data
    public static class ParticipantActivity {
        private Long userId;
        private String userName;
        private Integer votesCount;
        private Double participationRate;
    }
}
