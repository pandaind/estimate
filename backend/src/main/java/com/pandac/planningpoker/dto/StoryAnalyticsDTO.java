package com.pandac.planningpoker.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class StoryAnalyticsDTO {
    private Long storyId;
    private String storyTitle;
    private String storyDescription;
    private String status;
    private String priority;
    private Integer votingDuration; // in seconds
    private Integer totalVotes;
    private Integer voteCount; // alias for totalVotes
    private Integer participantCount;
    private String finalEstimate;
    private Boolean consensus;
    private Boolean consensusAchieved; // alias for consensus
    private Double consensusRate; // as percentage 0-100
    private Integer totalTimeSpent; // alias for votingDuration
    private Map<String, Integer> distribution;
    private Map<String, Integer> voteDistribution; // alias for distribution
    private Statistics statistics;
    private List<VoteResponse> votes;
    
    @Data
    public static class Statistics {
        private Double mean;
        private Double median;
        private String mode;
        private Double stdDeviation;
        private Double confidenceAverage;
    }
}
