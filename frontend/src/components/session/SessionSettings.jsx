import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faXmark, faClock, faEye, faUsers, faCheck } from '@fortawesome/free-solid-svg-icons';
import { sessionAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';

/**
 * SessionSettings Component
 * Allows moderators to configure session settings
 */
const SessionSettings = ({ session, onUpdate, onClose }) => {
  const [settings, setSettings] = useState({
    autoReveal: session?.autoReveal || false,
    timerEnabled: session?.timerEnabled || false,
    timerDuration: session?.timerDuration || 300,
    allowChangeVote: session?.allowChangeVote === true,
    allowObservers: session?.allowObservers !== undefined ? session.allowObservers : true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await sessionAPI.update(session.sessionCode, {
        settings,
      });
      
      setSuccess(true);
      onUpdate(response.data);
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const parsedError = handleError(err);
      setError(parsedError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faGear} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Session Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-300 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                Settings saved successfully!
              </p>
            </div>
          )}

          {/* Auto Reveal */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <FontAwesomeIcon icon={faEye} className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Auto Reveal
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically reveal votes when all participants have voted
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReveal}
                  onChange={(e) => handleChange('autoReveal', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Timer Enabled */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Enable Timer
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use a countdown timer for each story estimation
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.timerEnabled}
                  onChange={(e) => handleChange('timerEnabled', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
              
              {/* Timer Duration */}
              {settings.timerEnabled && (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timer Duration (seconds)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="30"
                      max="3600"
                      step="30"
                      value={settings.timerDuration}
                      onChange={(e) => handleChange('timerDuration', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                      {Math.floor(settings.timerDuration / 60)}:{String(settings.timerDuration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Range: 30 seconds to 1 hour
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Allow Change Vote */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Allow Vote Changes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Let participants change their votes before reveal
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowChangeVote}
                  onChange={(e) => handleChange('allowChangeVote', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Allow Observers */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Allow Observers
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable observer mode for users who don't vote
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowObservers}
                  onChange={(e) => handleChange('allowObservers', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SessionSettings;
