import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faUsers, faArrowTrendUp, faTrophy, faClock, faChartBar } from '@fortawesome/free-solid-svg-icons';
import VotingDistribution from './VotingDistribution';
import ConsensusIndicator from './ConsensusIndicator';

/**
 * StoryAnalytics Component
 * Display detailed analytics for a specific story
 */
const StoryAnalytics = ({ analytics }) => {
  const storyMetrics = [
    {
      title: 'Total Votes',
      value: analytics.totalVotes || 0,
      subtitle: `${analytics.participantCount || 0} participants`,
      icon: faUsers,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Final Estimate',
      value: analytics.finalEstimate || 'N/A',
      subtitle: analytics.finalEstimate ? 'Agreed estimate' : 'Not finalized',
      icon: faTrophy,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Consensus',
      value: analytics.consensusRate ? `${analytics.consensusRate.toFixed(0)}%` : '0%',
      subtitle: analytics.consensusAchieved ? 'Achieved' : 'Not achieved',
      icon: faBullseye,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Time Spent',
      value: analytics.totalTimeSpent ? `${Math.round(analytics.totalTimeSpent)}s` : '0s',
      subtitle: 'Total voting time',
      icon: faClock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Story Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {analytics.storyTitle}
        </h3>
        {analytics.storyDescription && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {analytics.storyDescription}
          </p>
        )}
        
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            analytics.status === 'COMPLETED'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : analytics.status === 'IN_PROGRESS'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {analytics.status.replace('_', ' ')}
          </span>
          
          {analytics.priority && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              analytics.priority === 'CRITICAL'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : analytics.priority === 'HIGH'
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : analytics.priority === 'MEDIUM'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {analytics.priority}
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        {storyMetrics.map((metric, index) => {
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
          <span>Consensus Level</span>
        </h3>
        <ConsensusIndicator 
          consensusRate={analytics.consensusRate}
          consensusAchieved={analytics.consensusAchieved}
        />
      </div>

      {/* Voting Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Vote Distribution</span>
        </h3>
        <VotingDistribution distribution={analytics.voteDistribution} />
      </div>

      {/* Individual Votes */}
      {analytics.votes && analytics.votes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Individual Votes</span>
          </h3>
          
          <div className="space-y-3">
            {analytics.votes.map((vote, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {vote.user?.avatar || vote.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {vote.user?.name || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  {vote.confidence && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence:
                      </span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-2 h-4 rounded ${
                              level <= vote.confidence
                                ? 'bg-blue-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faArrowTrendUp} className="w-4 h-4 text-gray-500" />
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {vote.estimate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Statistical Summary</span>
        </h3>
        
        <div className="grid grid-cols-4 gap-6">
          {analytics.statistics && (
            <>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.statistics.mean?.toFixed(1) || 'N/A'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Median</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.statistics.median || 'N/A'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mode</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.statistics.mode || 'N/A'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Range</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.statistics.range || 'N/A'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryAnalytics;
