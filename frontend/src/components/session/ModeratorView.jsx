import EstimationCards from '../EstimationCards';
import StoryList from '../StoryList';
import VotingResults from '../VotingResults';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';

/**
 * Tab-content area for moderators.
 */
export default function ModeratorView({
  activeTab,
  session,
  currentStory,
  userName,
  userId,
  onVoteSubmitted,
  onStorySelected,
  onStoriesUpdate,
  showCreateStoryForm,
  onToggleCreateStoryForm,
  onFinalizeEstimate,
}) {
  return (
    <div key={activeTab}>
      {activeTab === 'estimate' && (
        <EstimationCards
          session={session}
          currentStory={currentStory}
          userName={userName}
          userId={userId}
          isModerator={true}
          onVoteSubmitted={onVoteSubmitted}
        />
      )}

      {activeTab === 'stories' && (
        <StoryList
          session={{ ...session, onStoriesUpdate }}
          onStorySelected={onStorySelected}
          currentStory={currentStory}
          userName={userName}
          isModerator={true}
          showCreateForm={showCreateStoryForm}
          onToggleCreateForm={onToggleCreateStoryForm}
        />
      )}

      {activeTab === 'results' && (
        <VotingResults
          session={session}
          currentStory={currentStory}
          onFinalizeEstimate={onFinalizeEstimate}
          isModerator={true}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          sessionCode={session.sessionCode}
          currentStoryId={currentStory?.id}
        />
      )}
    </div>
  );
}
