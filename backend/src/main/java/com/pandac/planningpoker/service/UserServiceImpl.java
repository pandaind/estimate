package com.pandac.planningpoker.service;

import com.pandac.planningpoker.dto.UpdateUserRequest;
import com.pandac.planningpoker.exception.UserNotFoundException;
import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.User;
import com.pandac.planningpoker.repository.UserRepository;
import com.pandac.planningpoker.service.interfaces.ISessionService;
import com.pandac.planningpoker.service.interfaces.IUserService;
import com.pandac.planningpoker.security.SessionAccessValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final ISessionService sessionService;
    private final SessionAccessValidator sessionAccessValidator;

    public List<User> getActiveUsers(String sessionCode, Boolean activeOnly) {
        Session session = sessionService.getSession(sessionCode);
        if (activeOnly) {
            return userRepository.findBySessionAndIsActive(session, true);
        }
        return userRepository.findBySession(session);
    }

    public User getUser(String sessionCode, Long userId) {
        Session session = sessionService.getSession(sessionCode);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        sessionAccessValidator.requireUserBelongsToSession(user, session);

        return user;
    }

    public User updateUser(String sessionCode, Long userId, UpdateUserRequest request) {
        User user = getUser(sessionCode, userId);

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        return userRepository.save(user);
    }
}
