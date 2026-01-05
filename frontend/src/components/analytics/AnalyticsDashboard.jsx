import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faArrowTrendUp, faUsers, faBullseye, faClock, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { analyticsAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';
import SessionMetrics from './SessionMetrics';
import StoryAnalytics from './StoryAnalytics';

/**
 * AnalyticsDashboard Component
 * Main analytics view showing session and story insights
 */
const AnalyticsDashboard = ({ sessionCode, currentStoryId = null }) => {
  const [sessionAnalytics, setSessionAnalytics] = useState(null);
  const [storyAnalytics, setStoryAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('session');

  useEffect(() => {
    fetchAnalytics();
  }, [sessionCode, currentStoryId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch session analytics
      const sessionResponse = await analyticsAPI.getSession(sessionCode);
      setSessionAnalytics(sessionResponse.data);

      // Fetch story analytics if a story is selected
      if (currentStoryId) {
        const storyResponse = await analyticsAPI.getStory(sessionCode, currentStoryId);
        setStoryAnalytics(storyResponse.data);
      }
    } catch (err) {
      const parsedError = handleError(err);
      setError(parsedError.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'session', label: 'Session Overview', icon: faChartBar },
    { id: 'story', label: 'Story Details', icon: faBullseye },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={faChartBar} className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Session insights and metrics
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faArrowTrendUp} className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'session' && sessionAnalytics && (
          <SessionMetrics analytics={sessionAnalytics} />
        )}
        
        {activeTab === 'story' && currentStoryId && storyAnalytics && (
          <StoryAnalytics analytics={storyAnalytics} />
        )}
        
        {activeTab === 'story' && !currentStoryId && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
            <FontAwesomeIcon icon={faBullseye} className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Story Selected
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please select a story from the Stories tab to view detailed analytics.
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {sessionAnalytics && (
        <div className="grid grid-cols-4 gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faBullseye} className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{sessionAnalytics.totalStories}</span>
            </div>
            <p className="text-blue-100">Total Stories</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faTrophy} className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{sessionAnalytics.completedStories}</span>
            </div>
            <p className="text-green-100">Completed</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faUsers} className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{sessionAnalytics.participantCount}</span>
            </div>
            <p className="text-purple-100">Participants</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faClock} className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">
                {sessionAnalytics.velocityMetrics?.storiesPerHour?.toFixed(1) || '0'}
              </span>
            </div>
            <p className="text-orange-100">Stories/Hour</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
