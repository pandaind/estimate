package com.pandac.planningpoker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteResponse {
    private Long id;
    private String estimate;
    private Integer confidence;
    private LocalDateTime votedAt;
    private UserInfo user;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String name;
        private String avatar;
        private Boolean isModerator;
        private Boolean isObserver;
    }
}
