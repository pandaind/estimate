package com.pandac.planningpoker.dto;

import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    private String sessionCode;
    private Long userId;
    private User user;
    private Session session;
    private String token;
}
