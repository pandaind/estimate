import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

/**
 * ObserverMode Component
 * UI for observer role with view-only access
 */
const ObserverMode = ({ session, stories, currentStory, votes = [] }) => {
  return (
    <div className="space-y-6">
      {/* Observer Banner */}
      <div className="bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={faEye} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Observer Mode
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're viewing this session in read-only mode. You cannot vote or make changes.
            </p>
          </div>
        </div>
      </div>

      {/* Session Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {session?.sessionName || 'Planning Session'}
        </h3>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stories?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Stories</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stories?.filter(s => s.status === 'COMPLETED').length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {session?.participantCount || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {votes?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Votes Cast</div>
          </div>
        </div>
      </div>

      {/* Current Story */}
      {currentStory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Story
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStory.title}
              </h4>
              {currentStory.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {currentStory.description}
                </p>
              )}
            </div>

            {currentStory.acceptanceCriteria && (
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Acceptance Criteria
                </h5>
                <p className="text-gray-700 dark:text-gray-300">
                  {currentStory.acceptanceCriteria}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3">
              {currentStory.priority && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    currentStory.priority === 'CRITICAL'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : currentStory.priority === 'HIGH'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      : currentStory.priority === 'MEDIUM'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {currentStory.priority}
                </span>
              )}
              
              {currentStory.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voting Status */}
      {session?.votesRevealed && votes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Voting Results
          </h3>
          
          <div className="space-y-3">
            {votes.map((vote, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {vote.userName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {vote.userName}
                  </span>
                </div>
                
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {vote.estimate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!session?.votesRevealed && votes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faEyeSlash} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Voting in progress
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {votes.length} vote{votes.length !== 1 ? 's' : ''} cast. Waiting for moderator to reveal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Stories
        </h3>
        
        <div className="space-y-2">
          {stories?.map((story, index) => (
            <div
              key={story.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {story.title}
                </span>
              </div>
              
              {story.finalEstimate && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold ml-2">
                  {story.finalEstimate}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObserverMode;
