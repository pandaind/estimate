package com.pandac.planningpoker.dto;

import com.pandac.planningpoker.model.Session;
import com.pandac.planningpoker.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionResponse {
    private Session session;
    private String token;
    private Long moderatorId;
    private User moderator;
}
