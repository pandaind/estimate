import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

/**
 * UserPresence Component
 * Display live user count
 */
const UserPresence = ({ sessionCode, users = [], session }) => {
  // Calculate participant count based on moderatorCanVote setting
  const participantCount = session?.moderatorCanVote 
    ? users.length 
    : users.filter(user => !user.isModerator).length;

  return (
    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
        {participantCount}
      </span>
      <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
        {participantCount === 1 ? 'participant' : 'participants'}
      </span>
    </div>
  );
};

export default UserPresence;
