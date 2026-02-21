import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUsers } from '@fortawesome/free-solid-svg-icons';
import { sessionAPI } from '../utils/api';
import { AVATARS } from '../utils/constants';

const JoinSession = ({ onSessionJoined }) => {
  const [formData, setFormData] = useState({
    sessionCode: '',
    name: '',
    avatar: AVATARS[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await sessionAPI.join(formData.sessionCode.toUpperCase(), {
        name: formData.name,
        avatar: formData.avatar
      });
      onSessionJoined(response.data, formData.name);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-8">
      <div className="mb-5 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Join Session</h2>
        <p className="text-gray-500 dark:text-gray-400">Enter the session code to join</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="session-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Session Code
          </label>
          <input
            type="text"
            id="session-code"
            name="sessionId"
            aria-label="Session code"
            value={formData.sessionCode}
            onChange={(e) => setFormData({ ...formData, sessionCode: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-xl tracking-widest"
            placeholder="ABC123"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your Name
          </label>
          <input
            type="text"
            id="user-name"
            name="userName"
            aria-label="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Avatar
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {AVATARS.map((avatar, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => setFormData({ ...formData, avatar })}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center border-2 transition-colors ${
                  formData.avatar === avatar
                    ? 'border-secondary-500 bg-secondary-100'
                    : 'border-gray-300 hover:border-secondary-300'
                }`}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
              <span>Join Session</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default JoinSession;
