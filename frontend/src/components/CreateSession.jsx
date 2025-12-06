import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { sessionAPI, tokenManager } from '../utils/api';
import { SIZING_METHODS } from '../utils/constants';

const CreateSession = ({ onSessionCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    moderatorName: '',
    sizingMethod: 'FIBONACCI',
    customValues: '',
    moderatorCanVote: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const sessionData = {
        name: formData.name,
        moderatorName: formData.moderatorName,
        sizingMethod: formData.sizingMethod,
        moderatorCanVote: formData.moderatorCanVote,
        ...(formData.sizingMethod === 'CUSTOM' && {
          customValues: formData.customValues.split(',').map(v => v.trim()).filter(v => v)
        })
      };
      
      const response = await sessionAPI.create(sessionData);
      // Backend now returns CreateSessionResponse { session, token, moderatorId, moderator }
      const { session, token, moderatorId } = response.data;
      
      // Store the JWT token for the moderator
      tokenManager.set(token);
      
      // Pass session and moderator info to parent
      onSessionCreated(session, formData.moderatorName, moderatorId);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.message || 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Session</h2>
        <p className="text-gray-500 dark:text-gray-400">Start a new estimation session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Session Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Sprint Planning"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your Name
          </label>
          <input
            type="text"
            value={formData.moderatorName}
            onChange={(e) => setFormData({ ...formData, moderatorName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Sizing Method
          </label>
          <select
            value={formData.sizingMethod}
            onChange={(e) => setFormData({ ...formData, sizingMethod: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(SIZING_METHODS).map(([key, method]) => (
              <option key={key} value={key}>
                {method.name}
              </option>
            ))}
          </select>
          
          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
            <div className="flex flex-wrap gap-2">
              {SIZING_METHODS[formData.sizingMethod].values.map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {formData.sizingMethod === 'CUSTOM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Custom Values
            </label>
            <input
              type="text"
              value={formData.customValues}
              onChange={(e) => setFormData({ ...formData, customValues: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1, 2, 3, 5, 8, 13, ?"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter values separated by commas
            </p>
          </div>
        )}

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="moderatorCanVote"
            checked={formData.moderatorCanVote}
            onChange={(e) => setFormData({ ...formData, moderatorCanVote: e.target.checked })}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="moderatorCanVote" className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Allow moderator to vote</span>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              If enabled, you (the host) will be able to vote on stories along with participants.
            </p>
          </label>
        </div>

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
              <span>Create Session</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSession;
