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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
              {currentStory.title}
            </h2>
            {currentStory.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-3xl">
                {currentStory.description}
              </p>
            )}
          </div>

          {session.timerEnabled && (
            <div className="sm:ml-4 self-start sm:self-auto flex-shrink-0">
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
