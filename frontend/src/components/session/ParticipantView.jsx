import EstimationCards from '../EstimationCards';

/**
 * View for non-moderator participants.
 * Shows a waiting state when no story is active, otherwise shows voting cards.
 */
export default function ParticipantView({
  session,
  currentStory,
  userName,
  userId,
  onVoteSubmitted,
}) {
  if (!currentStory) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Waiting for Host
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          The host will activate a story for voting shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EstimationCards
        session={session}
        currentStory={currentStory}
        userName={userName}
        userId={userId}
        isModerator={false}
        onVoteSubmitted={onVoteSubmitted}
      />
    </div>
  );
}
