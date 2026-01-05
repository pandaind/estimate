import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * ConsensusIndicator Component
 * Visual indicator of consensus achievement level
 */
const ConsensusIndicator = ({ consensusRate, consensusAchieved = null }) => {
  const getConsensusLevel = () => {
    if (consensusRate >= 80) {
      return {
        level: 'High',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500',
        icon: faCircleCheck,
        description: 'Strong agreement among participants',
      };
    } else if (consensusRate >= 60) {
      return {
        level: 'Moderate',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-500',
        icon: faCircleExclamation,
        description: 'Reasonable agreement, consider discussion',
      };
    } else {
      return {
        level: 'Low',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        borderColor: 'border-orange-500',
        icon: faCircleXmark,
        description: 'Significant disagreement, discussion recommended',
      };
    }
  };

  const consensus = getConsensusLevel();

  return (
    <div className="space-y-4">
      {/* Consensus Bar */}
      <div className="relative">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${consensusRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${
              consensusRate >= 80
                ? 'from-green-500 to-green-600'
                : consensusRate >= 60
                ? 'from-blue-500 to-blue-600'
                : 'from-orange-500 to-orange-600'
            }`}
          />
        </div>
        
        {/* Percentage Text - Always Visible */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-bold text-lg ${
            consensusRate >= 50 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {consensusRate?.toFixed(1)}%
          </span>
        </div>
        
        {/* Threshold Markers */}
        <div className="absolute top-0 left-[60%] w-0.5 h-12 bg-gray-400 dark:bg-gray-500 opacity-50" />
        <div className="absolute top-0 left-[80%] w-0.5 h-12 bg-gray-400 dark:bg-gray-500 opacity-50" />
      </div>

      {/* Consensus Level Badge */}
      <div className={`${consensus.bgColor} border-2 ${consensus.borderColor} rounded-lg p-4`}>
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={consensus.icon} className={`w-8 h-8 ${consensus.color}`} />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-lg font-bold ${consensus.color}`}>
                {consensus.level} Consensus
              </span>
              {consensusAchieved !== null && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  consensusAchieved
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                }`}>
                  {consensusAchieved ? 'Achieved' : 'Not Achieved'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {consensus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Threshold Legend */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
          <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
            Low
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            &lt; 60%
          </div>
        </div>
        
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
            Moderate
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            60-79%
          </div>
        </div>
        
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
            High
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            ≥ 80%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsensusIndicator;
