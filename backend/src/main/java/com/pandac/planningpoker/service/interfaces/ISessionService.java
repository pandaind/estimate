package com.pandac.planningpoker.service.interfaces;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Session;

public interface ISessionService {

    CreateSessionResponse createSession(CreateSessionRequest request);

    Session getSession(String sessionCode);

    Session updateSession(String sessionCode, UpdateSessionRequest request);

    void deleteSession(String sessionCode);

    UserSession joinSession(String sessionCode, JoinSessionRequest request);

    void leaveSession(String sessionCode, Long userId);

    VoteReveal revealVotes(String sessionCode);

    void resetVotes(String sessionCode);

    Session setCurrentStory(String sessionCode, Long storyId);
}
