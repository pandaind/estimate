import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faClock, faEye, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * TimerSettings Component
 * Configure timer duration and auto-reveal options
 */
const TimerSettings = ({ 
  initialDuration = 300,
  initialAutoReveal = false,
  initialSoundEnabled = true,
  onSave,
  onClose
}) => {
  const [duration, setDuration] = useState(initialDuration);
  const [autoReveal, setAutoReveal] = useState(initialAutoReveal);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);

  const presetDurations = [
    { label: '1 min', value: 60 },
    { label: '2 min', value: 120 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
  ];

  const handleSave = () => {
    onSave?.({
      duration,
      autoReveal,
      soundEnabled,
    });
    onClose?.();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FontAwesomeIcon icon={faGear} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Timer Settings
        </h2>
      </div>

      <div className="space-y-6">
        {/* Duration Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <FontAwesomeIcon icon={faClock} className="w-4 h-4 inline mr-2" />
            Timer Duration: {formatDuration(duration)}
          </label>
          
          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {presetDurations.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setDuration(preset.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  duration === preset.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min="30"
              max="3600"
              step="30"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>30s</span>
              <span>1h</span>
            </div>
          </div>

          {/* Custom Input */}
          <div className="mt-4">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Custom duration (seconds)
            </label>
            <input
              type="number"
              min="30"
              max="3600"
              step="30"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Auto-Reveal Setting */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReveal}
              onChange={(e) => setAutoReveal(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <FontAwesomeIcon icon={faEye} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Auto-Reveal Votes
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Automatically reveal all votes when the timer expires
              </p>
            </div>
          </label>
        </div>

        {/* Sound Setting */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {soundEnabled ? (
                  <FontAwesomeIcon icon={faVolumeHigh} className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                ) : (
                  <FontAwesomeIcon icon={faVolumeXmark} className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  Sound Notifications
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Play sound alerts when timer is running low and when time expires
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
            How it works
          </h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Timer starts when you click the Start button</li>
            <li>• Warning appears at 30 seconds remaining</li>
            <li>• Critical alert shows in last 10 seconds</li>
            {autoReveal && <li>• Votes will be revealed automatically when time expires</li>}
            {soundEnabled && <li>• Sound alerts will play during countdown</li>}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default TimerSettings;
