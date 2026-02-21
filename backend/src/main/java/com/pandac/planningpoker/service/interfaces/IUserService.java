package com.pandac.planningpoker.service.interfaces;

import com.pandac.planningpoker.dto.UpdateUserRequest;
import com.pandac.planningpoker.model.User;

import java.util.List;

public interface IUserService {

    List<User> getActiveUsers(String sessionCode, Boolean activeOnly);

    User getUser(String sessionCode, Long userId);

    User updateUser(String sessionCode, Long userId, UpdateUserRequest request);
}
