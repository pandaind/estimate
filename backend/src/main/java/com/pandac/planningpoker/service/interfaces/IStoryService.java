package com.pandac.planningpoker.service.interfaces;

import com.pandac.planningpoker.dto.*;
import com.pandac.planningpoker.model.Story;
import com.pandac.planningpoker.model.StoryStatus;

import java.util.List;

public interface IStoryService {

    Story createStory(String sessionCode, CreateStoryRequest request);

    List<Story> getStories(String sessionCode, StoryStatus status);

    Story getStory(String sessionCode, Long storyId);

    Story updateStory(String sessionCode, Long storyId, UpdateStoryRequest request);

    void deleteStory(String sessionCode, Long storyId);

    Story finalizeEstimate(String sessionCode, Long storyId, String finalEstimate, String notes);

    Story resetStory(String sessionCode, Long storyId);
}
