package com.pandac.planningpoker.dto;

import lombok.Data;

@Data
public class SessionImportDTO {
    private SessionExportDTO sessionData;
    private Boolean generateNewCode = true;
}
