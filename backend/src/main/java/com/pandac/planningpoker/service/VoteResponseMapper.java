package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.VoteResponse;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.model.Vote;
import org.springframework.stereotype.Component;

@Component
public class VoteResponseMapper {

    public VoteResponse toVoteResponse(Vote vote) {
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
        userInfo.setIsModerator(user.isModerator());
        userInfo.setIsObserver(user.isObserver());

        response.setUser(userInfo);
        return response;
    }
}
