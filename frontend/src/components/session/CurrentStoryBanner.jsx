import VotingTimer from '../timer/VotingTimer';

/**
 * Banner shown beneath the header when a story is active.
 * Displays title, optional description, and the voting timer.
 */
export default function CurrentStoryBanner({
  currentStory,
  session,
  isModerator,
  onTimerComplete,
}) {
  if (!currentStory) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {currentStory.title}
            </h2>
            {currentStory.description && (
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-3xl">
                {currentStory.description}
              </p>
            )}
          </div>

          {session.timerEnabled && (
            <div className="ml-4">
              <VotingTimer
                key={`timer-${currentStory.id}-${session.timerEnabled ? 'enabled' : 'disabled'}`}
                duration={session.timerDuration || 300}
                autoReveal={session.autoReveal || false}
                autoStart={true}
                onComplete={isModerator ? onTimerComplete : undefined}
                readOnly={!isModerator}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
