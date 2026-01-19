import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faBook, faKeyboard, faLightbulb, faArrowRight } from '@fortawesome/free-solid-svg-icons';

/**
 * TutorialModal Component
 * Onboarding guide for new users
 */
const TutorialModal = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to EstiMate! 👋',
      icon: faBook,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            EstiMate is a collaborative estimation technique for agile teams.
            Let's walk through how to use this app effectively.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              What you'll learn:
            </h4>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
              <li>✓ Creating and joining sessions</li>
              <li>✓ Adding and voting on stories</li>
              <li>✓ Understanding roles and permissions</li>
              <li>✓ Keyboard shortcuts and tips</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Creating a Session',
      icon: faBook,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            As a <strong>Moderator</strong>, you can create a new planning session:
          </p>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
              <span>Click "Create Session" on the home screen</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
              <span>Enter a session name and choose a sizing method (Fibonacci, T-Shirt, etc.)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
              <span>Share the generated session code with your team</span>
            </li>
          </ol>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-300">
              💡 Tip: Session codes are case-insensitive and easy to share!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Adding Stories',
      icon: faBook,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Stories represent the work items you want to estimate:
          </p>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
              <span>Click "Add Story" to create a new user story</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
              <span>Fill in the title, description, and acceptance criteria</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
              <span>Optionally add tags and set priority level</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
              <span>Select a story to start voting on it</span>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Voting Process',
      icon: faBook,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Here's how the voting process works:
          </p>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
              <span>Each participant selects an estimation card independently</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
              <span>Optionally set your confidence level (1-5 stars)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
              <span>When everyone has voted, moderator reveals the votes</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
              <span>Discuss differences and re-vote if needed</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">5.</span>
              <span>Moderator finalizes the estimate when consensus is reached</span>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Roles & Permissions',
      icon: faBook,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2">
                👑 Moderator
              </h4>
              <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                <li>• Create and manage sessions</li>
                <li>• Add, edit, and delete stories</li>
                <li>• Reveal and reset votes</li>
                <li>• Finalize estimates</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">
                👤 Participant
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Cast votes on stories</li>
                <li>• View revealed votes</li>
                <li>• Update your profile</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 dark:text-gray-300 mb-2">
                👁️ Observer
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-400 space-y-1">
                <li>• View session in read-only mode</li>
                <li>• See stories and voting progress</li>
                <li>• Cannot vote or make changes</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Keyboard Shortcuts',
      icon: faKeyboard,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Power user? Use these keyboard shortcuts:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Create Story
                </span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  N
                </kbd>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Reveal Votes
                </span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  R
                </kbd>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Next Story
                </span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  →
                </kbd>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Prev Story
                </span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  ←
                </kbd>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tips & Best Practices',
      icon: faLightbulb,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Get the most out of EstiMate:
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  Keep stories focused
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Break down large stories into smaller, estimable pieces
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💬</span>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  Discuss differences
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When estimates vary widely, have the high and low voters explain their reasoning
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  Use the timer
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set time limits to keep discussions focused and productive
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  Review analytics
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check session metrics to improve your team's estimation process
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={step.icon} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {step.content}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {/* Progress Dots */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600 dark:bg-blue-400 w-6'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TutorialModal;
