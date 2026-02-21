package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.SessionAnalyticsDTO;
import com.pandac.planningpoker.dto.StoryAnalyticsDTO;
import com.pandac.planningpoker.dto.VoteResponse;
import com.pandac.planningpoker.exception.ResourceNotFoundException;
import com.pandac.planningpoker.model.*;
import com.pandac.planningpoker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final SessionRepository sessionRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final VoteStatisticsCalculator voteStatisticsCalculator;
    
    /**
     * Get detailed analytics for a specific story's votes
     */
    public StoryAnalyticsDTO getStoryAnalytics(String sessionCode, Long storyId) {
        Session session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionCode));
        
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        
        if (!story.getSession().getId().equals(session.getId())) {
            throw new ResourceNotFoundException("Story does not belong to this session");
        }
        
        List<Vote> votes = voteRepository.findByStory(story);
        
        StoryAnalyticsDTO analytics = new StoryAnalyticsDTO();
        analytics.setStoryId(storyId);
        analytics.setStoryTitle(story.getTitle());
        analytics.setStoryDescription(story.getDescription());
        analytics.setStatus(story.getStatus() != null ? story.getStatus().toString() : "NOT_ESTIMATED");
        analytics.setPriority(story.getPriority() != null ? story.getPriority().toString() : null);
        analytics.setFinalEstimate(story.getFinalEstimate());
        analytics.setVoteCount(votes.size());
        analytics.setTotalVotes(votes.size());
        
        // Get participant count from session
        List<User> participants = userRepository.findBySessionAndIsActive(session, true);
        // Filter based on moderatorCanVote setting
        long participantCount = session.getModeratorCanVote() 
            ? participants.size() 
            : participants.stream().filter(u -> !u.getIsModerator()).count();
        analytics.setParticipantCount((int) participantCount);
        
        if (!votes.isEmpty()) {
            // Use shared calculator for all statistics
            VoteStatisticsCalculator.VoteStatistics stats = voteStatisticsCalculator.calculate(votes);

            analytics.setDistribution(stats.getDistribution());
            analytics.setVoteDistribution(stats.getDistribution()); // alias

            // Convert votes to VoteResponse for detailed view
            List<VoteResponse> voteResponses = votes.stream()
                    .map(this::convertToVoteResponse)
                    .collect(Collectors.toList());
            analytics.setVotes(voteResponses);

            // Populate StoryAnalyticsDTO.Statistics from calculator result
            if (!stats.getNumericValues().isEmpty()) {
                StoryAnalyticsDTO.Statistics storyStats = new StoryAnalyticsDTO.Statistics();
                storyStats.setMean(stats.getAverage());
                storyStats.setMedian(stats.getAverage() != null
                        ? Double.parseDouble(stats.getMedian()) : 0.0);
                storyStats.setMode(stats.getMode());
                storyStats.setStdDeviation(stats.getStdDeviation() != null ? stats.getStdDeviation() : 0.0);
                storyStats.setConfidenceAverage(0.0);
                analytics.setStatistics(storyStats);
            }

            analytics.setConsensus(stats.isConsensus());
            analytics.setConsensusAchieved(stats.isConsensus()); // alias
            analytics.setConsensusRate(stats.isConsensus() ? 100.0 : 0.0);
            
            // Calculate voting duration if votes have timestamps
            if (votes.stream().allMatch(v -> v.getVotedAt() != null)) {
                LocalDateTime firstVote = votes.stream()
                        .map(Vote::getVotedAt)
                        .min(LocalDateTime::compareTo)
                        .orElse(null);
                LocalDateTime lastVote = votes.stream()
                        .map(Vote::getVotedAt)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);
                
                if (firstVote != null && lastVote != null) {
                    long durationSeconds = Duration.between(firstVote, lastVote).getSeconds();
                    analytics.setVotingDuration((int) durationSeconds);
                    analytics.setTotalTimeSpent((int) durationSeconds); // alias
                }
            }
        } else {
            analytics.setDistribution(new HashMap<>());
            analytics.setVoteDistribution(new HashMap<>()); // alias
            analytics.setConsensus(false);
            analytics.setConsensusAchieved(false); // alias
            analytics.setConsensusRate(0.0);
            analytics.setTotalVotes(0);
            analytics.setTotalTimeSpent(0);
        }
        
        return analytics;
    }
    
    /**
     * Get session-level analytics including all stories and participants
     */
    public SessionAnalyticsDTO getSessionAnalytics(String sessionCode) {
        Session session = sessionRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionCode));
        
        List<Story> stories = storyRepository.findBySessionOrderByOrderIndex(session);
        List<User> users = userRepository.findBySessionAndIsActive(session, true);
        
        SessionAnalyticsDTO analytics = new SessionAnalyticsDTO();
        analytics.setSessionCode(sessionCode);
        analytics.setTotalStories(stories.size());
        // Filter participant count based on moderatorCanVote setting
        long participantCount = session.getModeratorCanVote() 
            ? users.size() 
            : users.stream().filter(u -> !u.getIsModerator()).count();
        analytics.setParticipantCount((int) participantCount);
        
        // Count stories by status
        long completedStories = stories.stream()
                .filter(s -> s.getStatus() == StoryStatus.COMPLETED)
                .count();
        analytics.setCompletedStories((int) completedStories);
        
        long inProgressStories = stories.stream()
                .filter(s -> s.getStatus() == StoryStatus.IN_PROGRESS)
                .count();
        analytics.setInProgressStories((int) inProgressStories);
        
        // Count estimated stories (those with final estimate)
        long estimatedStories = stories.stream()
                .filter(s -> s.getFinalEstimate() != null && !s.getFinalEstimate().isEmpty())
                .count();
        analytics.setEstimatedStories((int) estimatedStories);
        
        // Calculate session duration
        if (session.getCreatedAt() != null) {
            long durationMinutes = Duration.between(session.getCreatedAt(), LocalDateTime.now()).toMinutes();
            analytics.setDuration((int) durationMinutes);
        }
        
        // Calculate total votes cast
        int totalVotes = stories.stream()
                .mapToInt(story -> voteRepository.findByStory(story).size())
                .sum();
        analytics.setTotalVotes(totalVotes);
        
        // Calculate consensus rate
        if (!stories.isEmpty()) {
            long storiesWithConsensus = stories.stream()
                    .filter(story -> {
                        List<Vote> votes = voteRepository.findByStory(story);
                        if (votes.isEmpty()) return false;
                        Set<String> uniqueEstimates = votes.stream()
                                .map(Vote::getEstimate)
                                .collect(Collectors.toSet());
                        return uniqueEstimates.size() == 1;
                    })
                    .count();
            // Return as percentage
            analytics.setConsensusRate((double) storiesWithConsensus / stories.size() * 100.0);
        } else {
            analytics.setConsensusRate(0.0);
        }
        
        // Calculate average voting time
        List<Integer> votingTimes = new ArrayList<>();
        for (Story story : stories) {
            List<Vote> votes = voteRepository.findByStory(story);
            if (votes.size() > 1 && votes.stream().allMatch(v -> v.getVotedAt() != null)) {
                LocalDateTime firstVote = votes.stream()
                        .map(Vote::getVotedAt)
                        .min(LocalDateTime::compareTo)
                        .orElse(null);
                LocalDateTime lastVote = votes.stream()
                        .map(Vote::getVotedAt)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);
                
                if (firstVote != null && lastVote != null) {
                    votingTimes.add((int) Duration.between(firstVote, lastVote).getSeconds());
                }
            }
        }
        
        if (!votingTimes.isEmpty()) {
            double avgTime = votingTimes.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            analytics.setAverageVotingTime(avgTime);
        }
        
        // Calculate velocity metrics (story points)
        List<Double> storyPoints = stories.stream()
                .filter(s -> s.getFinalEstimate() != null && isNumeric(s.getFinalEstimate()))
                .map(s -> Double.parseDouble(s.getFinalEstimate()))
                .collect(Collectors.toList());
        
        if (!storyPoints.isEmpty()) {
            SessionAnalyticsDTO.VelocityMetrics velocity = new SessionAnalyticsDTO.VelocityMetrics();
            velocity.setTotalStoryPoints(storyPoints.stream().mapToDouble(Double::doubleValue).sum());
            velocity.setAverageStoryPoints(storyPoints.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
            
            // Calculate stories per hour
            if (analytics.getDuration() != null && analytics.getDuration() > 0) {
                double hours = analytics.getDuration() / 60.0;
                velocity.setStoriesPerHour(completedStories / hours);
            } else {
                velocity.setStoriesPerHour(0.0);
            }
            
            // Calculate average time per story
            if (!votingTimes.isEmpty() && !stories.isEmpty()) {
                double avgTime = votingTimes.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                velocity.setAverageTimePerStory(avgTime);
            } else {
                velocity.setAverageTimePerStory(0.0);
            }
            
            analytics.setVelocityMetrics(velocity);
        } else {
            // Set default velocity metrics
            SessionAnalyticsDTO.VelocityMetrics velocity = new SessionAnalyticsDTO.VelocityMetrics();
            velocity.setTotalStoryPoints(0.0);
            velocity.setAverageStoryPoints(0.0);
            velocity.setStoriesPerHour(0.0);
            velocity.setAverageTimePerStory(0.0);
            analytics.setVelocityMetrics(velocity);
        }
        
        // Participant activity
        List<SessionAnalyticsDTO.ParticipantActivity> participantActivities = users.stream()
                .filter(user -> !user.getIsObserver())
                .map(user -> {
                    SessionAnalyticsDTO.ParticipantActivity activity = new SessionAnalyticsDTO.ParticipantActivity();
                    activity.setUserId(user.getId());
                    activity.setUserName(user.getName());
                    
                    int userVotes = 0;
                    for (Story story : stories) {
                        boolean hasVoted = voteRepository.findByStory(story).stream()
                                .anyMatch(v -> v.getUser().getId().equals(user.getId()));
                        if (hasVoted) userVotes++;
                    }
                    activity.setVotesCount(userVotes);
                    
                    double participationRate = stories.isEmpty() ? 0.0 : (double) userVotes / stories.size();
                    activity.setParticipationRate(participationRate);
                    
                    return activity;
                })
                .collect(Collectors.toList());
        
        analytics.setParticipantActivity(participantActivities);
        
        return analytics;
    }
    
    private boolean isNumeric(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    private VoteResponse convertToVoteResponse(Vote vote) {
        VoteResponse response = new VoteResponse();
        response.setId(vote.getId());
        response.setEstimate(vote.getEstimate());
        response.setConfidence(vote.getConfidence());
        response.setVotedAt(vote.getVotedAt());
        
        User user = vote.getUser();
        VoteResponse.UserInfo userInfo = new VoteResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setName(user.getName());
        userInfo.setAvatar(user.getAvatar());
        userInfo.setIsModerator(user.getIsModerator());
        userInfo.setIsObserver(user.getIsObserver());
        
        response.setUser(userInfo);
        return response;
    }
}
