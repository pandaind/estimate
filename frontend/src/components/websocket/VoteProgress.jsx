import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from './WebSocketProvider';

/**
 * VoteProgress Component
 * Real-time voting progress indicator
 */
const VoteProgress = ({ sessionCode, totalParticipants, currentStoryId }) => {
  const { subscribe } = useWebSocket();
  const [voteCount, setVoteCount] = useState(0);
  const [voters, setVoters] = useState(new Set());

  useEffect(() => {
    if (!sessionCode || !currentStoryId) return;

    // Reset when story changes
    setVoteCount(0);
    setVoters(new Set());

    const unsubscribers = [];

    // Subscribe to vote cast events
    unsubscribers.push(
      subscribe('/vote-cast', (data) => {
        if (data.storyId === currentStoryId) {
          setVoters((prev) => {
            const updated = new Set(prev);
            updated.add(data.userId);
            return updated;
          });
          setVoteCount((prev) => prev + 1);
        }
      })
    );

    // Subscribe to vote deleted events
    unsubscribers.push(
      subscribe('/vote-deleted', (data) => {
        if (data.storyId === currentStoryId) {
          setVoters((prev) => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
          setVoteCount((prev) => Math.max(0, prev - 1));
        }
      })
    );

    // Subscribe to votes reset
    unsubscribers.push(
      subscribe('/votes-reset', () => {
        setVoteCount(0);
        setVoters(new Set());
      })
    );

    // Subscribe to votes revealed
    unsubscribers.push(
      subscribe('/votes-revealed', () => {
        // Keep the count but could add visual indication
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [sessionCode, currentStoryId, subscribe]);

  const percentage = totalParticipants > 0 
    ? Math.round((voteCount / totalParticipants) * 100) 
    : 0;

  const isComplete = voteCount === totalParticipants && totalParticipants > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Voting Progress
          </h3>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {voteCount} / {totalParticipants}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full flex items-center justify-center ${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}
        >
          {percentage > 15 && (
            <span className="text-white font-semibold text-sm">
              {percentage}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Status Message */}
      {isComplete ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center space-x-2 text-green-600 dark:text-green-400"
        >
          <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
          <span className="font-medium text-sm">All participants have voted!</span>
        </motion.div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Waiting for {totalParticipants - voteCount} more {totalParticipants - voteCount === 1 ? 'vote' : 'votes'}...
        </p>
      )}

      {/* Voter List (Optional - shows who voted) */}
      {voters.size > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {Array.from(voters).map((voterId, index) => (
              <motion.div
                key={voterId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
                title="Voted"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteProgress;
