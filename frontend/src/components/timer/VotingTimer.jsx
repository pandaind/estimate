import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPlay, faPause, faArrowRotateLeft, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

/**
 * VotingTimer Component
 * Countdown timer for voting sessions with auto-reveal
 */
const VotingTimer = ({ 
  duration = 300, // Default 5 minutes in seconds
  onComplete,
  autoReveal = false,
  autoStart = false,
  isActive = false,
  onToggle,
  readOnly = false
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    setTimeRemaining(duration);
    setHasCompleted(false);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [duration, autoStart]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasCompleted(true);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onComplete]);

  const handleToggle = useCallback(() => {
    setIsRunning((prev) => !prev);
    onToggle?.(!isRunning);
  }, [isRunning, onToggle]);

  const handleReset = useCallback(() => {
    setTimeRemaining(duration);
    setIsRunning(false);
    setHasCompleted(false);
  }, [duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;
  const isWarning = timeRemaining <= 30 && timeRemaining > 0;
  const isCritical = timeRemaining <= 10 && timeRemaining > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Voting Timer
          </h3>
        </div>
        
        {autoReveal && (
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4" />
            <span>Auto-reveal enabled</span>
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <motion.div
          animate={{
            scale: isCritical ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: isCritical ? Infinity : 0,
          }}
          className={`text-6xl font-bold mb-2 ${
            hasCompleted
              ? 'text-red-600 dark:text-red-400'
              : isCritical
              ? 'text-red-600 dark:text-red-400'
              : isWarning
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {formatTime(timeRemaining)}
        </motion.div>
        
        {hasCompleted && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 dark:text-red-400 font-medium"
          >
            Time's up!
          </motion.p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${
            isCritical
              ? 'bg-red-500'
              : isWarning
              ? 'bg-orange-500'
              : 'bg-blue-500'
          }`}
        />
      </div>

      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={handleToggle}
            disabled={hasCompleted}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              hasCompleted
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : isRunning
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <FontAwesomeIcon icon={faPause} className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlay} className="w-5 h-5" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faArrowRotateLeft} className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Status Messages */}
      {isWarning && !hasCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
        >
          <p className="text-sm text-orange-800 dark:text-orange-300 text-center font-medium">
            {isCritical ? '⚠️ Last 10 seconds!' : '⏰ Less than 30 seconds remaining'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default VotingTimer;
