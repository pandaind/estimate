import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faUsers, faCircleCheck, faClock, faBolt, faBullseye } from '@fortawesome/free-solid-svg-icons';
import VotingDistribution from './VotingDistribution';
import ConsensusIndicator from './ConsensusIndicator';

/**
 * SessionMetrics Component
 * Display session-level analytics and statistics
 */
const SessionMetrics = ({ analytics }) => {
  const completionRate = analytics.totalStories > 0
    ? ((analytics.completedStories / analytics.totalStories) * 100).toFixed(1)
    : 0;

  const metrics = [
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtitle: `${analytics.completedStories} of ${analytics.totalStories} stories`,
      icon: faCircleCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Consensus Rate',
      value: `${analytics.consensusRate?.toFixed(1)}%`,
      subtitle: 'Agreement among voters',
      icon: faBullseye,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Avg Time Per Story',
      value: `${Math.round(analytics.velocityMetrics?.averageTimePerStory || 0)}s`,
      subtitle: 'Time to complete voting',
      icon: faClock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Velocity',
      value: `${analytics.velocityMetrics?.storiesPerHour?.toFixed(1) || 0}`,
      subtitle: 'Stories per hour',
      icon: faBolt,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric, index) => {
          return (
            <motion.div
              key={metric.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${metric.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-start justify-between mb-3">
                <FontAwesomeIcon icon={metric.icon} className={`w-6 h-6 ${metric.color}`} />
                <span className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {metric.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Consensus Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FontAwesomeIcon icon={faBullseye} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Consensus Overview</span>
        </h3>
        <ConsensusIndicator consensusRate={analytics.consensusRate} />
      </div>

      {/* Story Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FontAwesomeIcon icon={faArrowTrendUp} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Story Status</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Total Stories</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {analytics.totalStories}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Completed</span>
            <div className="flex items-center space-x-2">
              <div className="flex-1 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {analytics.completedStories}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">In Progress</span>
            <div className="flex items-center space-x-2">
              <div className="flex-1 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${analytics.totalStories > 0 ? (analytics.inProgressStories / analytics.totalStories) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {analytics.inProgressStories}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Not Estimated</span>
            <div className="flex items-center space-x-2">
              <div className="flex-1 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 dark:bg-gray-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${analytics.totalStories > 0 ? ((analytics.totalStories - analytics.completedStories - analytics.inProgressStories) / analytics.totalStories) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {analytics.totalStories - analytics.completedStories - analytics.inProgressStories}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Activity */}
      {analytics.participantActivity && analytics.participantActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Participant Activity</span>
          </h3>
          
          <div className="space-y-3">
            {analytics.participantActivity.map((participant, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {participant.userName}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${participant.participationRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                      {participant.participationRate}%
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-500 w-16 text-right">
                    {participant.votesCount} votes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionMetrics;
