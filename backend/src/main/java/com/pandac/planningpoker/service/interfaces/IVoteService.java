package com.pandac.planningpoker.service.interfaces;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Vote;

import java.util.List;

public interface IVoteService {

    Vote castVote(String sessionCode, Long storyId, Long userId, VoteRequest request);

    List<VoteResponse> getVotes(String sessionCode, Long storyId, Boolean revealed);

    void deleteVote(String sessionCode, Long storyId, Long userId);
}
