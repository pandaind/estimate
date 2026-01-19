import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faXmark, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { userAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';

/**
 * UserProfile Component
 * Edit user profile (name and avatar)
 */
const UserProfile = ({ sessionCode, user, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    avatar: user.avatar || '👤',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const avatars = [
    '👤', '👨', '👩', '👨‍💻', '👩‍💻', '🧑‍💼', '👨‍🔬', '👩‍🔬',
    '🦸', '🦸‍♀️', '🧙', '🧙‍♀️', '🧑‍🚀', '👨‍🎨', '👩‍🎨', '🧑‍🏫',
    '🐶', '🐱', '🐼', '🦊', '🦁', '🐯', '🐸', '🐵',
    '🚀', '⚡', '🔥', '💡', '🎯', '🎨', '🎭', '🎪',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (formData.name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await userAPI.update(sessionCode, user.id, formData);
      onUpdate(response.data);
      onClose();
    } catch (err) {
      const parsedError = handleError(err);
      setError(parsedError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Profile
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

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Avatar
            </label>
            <div className="grid grid-cols-8 gap-2">
              {avatars.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                  className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.avatar === emoji
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{formData.avatar}</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{formData.name || 'Your Name'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.isObserver ? 'Observer' : 'Participant'}
                </p>
              </div>
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
              disabled={loading || !formData.name.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserProfile;
