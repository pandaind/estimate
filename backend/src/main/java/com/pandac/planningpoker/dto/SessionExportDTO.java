package com.pandac.planningpoker.dto;

import com.pandac.planningpoker.model.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SessionExportDTO {
    private Session session;
    private List<Story> stories;
    private List<Vote> votes;
    private List<User> users;
    private LocalDateTime exportedAt;
}
