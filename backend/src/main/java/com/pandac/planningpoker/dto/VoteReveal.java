package com.pandac.planningpoker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteReveal {
    private Long storyId;
    private List<VoteResponse> votes;
    private Boolean consensus;
    private Double averageEstimate;
    private String medianEstimate;
    private String recommendedEstimate;
    private Map<String, Integer> distribution; // vote value -> count
}
