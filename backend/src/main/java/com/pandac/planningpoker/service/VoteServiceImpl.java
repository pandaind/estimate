package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.VoteRequest;
import com.pandac.planningpoker.dto.VoteResponse;
import com.pandac.planningpoker.exception.InvalidVoteException;
import com.pandac.planningpoker.exception.StoryNotFoundException;
import com.pandac.planningpoker.exception.UserNotFoundException;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.model.Vote;
import com.pandac.planningpoker.repository.SessionRepository;
import com.pandac.planningpoker.repository.StoryRepository;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import com.pandac.planningpoker.service.interfaces.IVoteService;
import com.pandac.planningpoker.repository.UserRepository;
import com.pandac.planningpoker.repository.VoteRepository;
import com.pandac.planningpoker.security.SessionAccessValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VoteServiceImpl implements IVoteService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final SessionRepository sessionRepository;
    private final ISessionService sessionService;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final SessionAccessValidator sessionAccessValidator;
    private final VoteStatisticsCalculator voteStatisticsCalculator;

    public Vote castVote(String sessionCode, Long storyId, Long userId, VoteRequest request) {
        Session session = sessionService.getSession(sessionCode);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));

        sessionAccessValidator.requireStoryBelongsToSession(story, session);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        sessionAccessValidator.requireUserBelongsToSession(user, session);

        if (user.getIsObserver()) {
            throw new InvalidVoteException("Observers cannot vote");
        }

        if (!user.getIsActive()) {
            throw new InvalidVoteException("Inactive users cannot vote");
        }

        Optional<Vote> existingVote = voteRepository.findByStoryAndUser(story, user);
        Vote vote;

        if (existingVote.isPresent()) {
            if (!session.getSettings().getAllowChangeVote() && session.getVotesRevealed()) {
                throw new InvalidVoteException("Vote changes are not allowed after reveal");
            }
            vote = existingVote.get();
            vote.setEstimate(request.getEstimate());
            vote.setConfidence(request.getConfidence());
        } else {
            vote = new Vote();
            vote.setStory(story);
            vote.setUser(user);
            vote.setEstimate(request.getEstimate());
            vote.setConfidence(request.getConfidence());
        }

        vote = voteRepository.save(vote);

        // Check for auto-reveal
        if (session.getSettings().getAutoReveal() && !session.getVotesRevealed()) {
            List<User> activeUsers = userRepository.findBySessionAndIsActiveAndIsObserver(session, true, false);
            List<Vote> currentVotes = voteRepository.findByStory(story);

            if (currentVotes.size() >= activeUsers.size()) {
                session.setVotesRevealed(true);
                sessionRepository.save(session);
                webSocketEventPublisher.votesRevealed(sessionCode, story.getId());
            }
        }

        return vote;
    }

    public List<VoteResponse> getVotes(String sessionCode, Long storyId, Boolean revealed) {
        Session session = sessionService.getSession(sessionCode);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));

        sessionAccessValidator.requireStoryBelongsToSession(story, session);

        if (revealed && !session.getVotesRevealed()) {
            return new ArrayList<>();
        }

        List<Vote> votes = voteRepository.findByStory(story);
        return votes.stream()
                .map(this::convertToVoteResponse)
                .collect(Collectors.toList());
    }

    public void deleteVote(String sessionCode, Long storyId, Long userId) {
        Session session = sessionService.getSession(sessionCode);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new StoryNotFoundException(storyId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        sessionAccessValidator.requireStoryBelongsToSession(story, session);

        // Idempotent — no error if vote doesn't exist
        Optional<Vote> vote = voteRepository.findByStoryAndUser(story, user);
        vote.ifPresent(voteRepository::delete);
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
