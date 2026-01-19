import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faFileCode, faUsers, faBullseye } from '@fortawesome/free-solid-svg-icons';

/**
 * DataPreview Component
 * Collapsible preview of import data
 */
const DataPreview = ({ data }) => {
  const [expanded, setExpanded] = useState(true);
  const [expandedStories, setExpandedStories] = useState(new Set());

  const toggleStory = (index) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStories(newExpanded);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {expanded ? (
            <FontAwesomeIcon icon={faChevronDown} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
          <FontAwesomeIcon icon={faFileCode} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-white">
            Data Preview
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {data.stories?.length || 0} stories
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Session Info */}
          {data.sessionName && (
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Session Information
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {data.sessionName}
                  </span>
                </div>
                {data.sessionCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Code:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {data.sessionCode}
                    </span>
                  </div>
                )}
                {data.sizingMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sizing:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {data.sizingMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stories List */}
          <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <FontAwesomeIcon icon={faBullseye} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Stories ({data.stories?.length || 0})
              </span>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.stories?.map((story, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded"
                >
                  <button
                    onClick={() => toggleStory(index)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {expandedStories.has(index) ? (
                        <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-white font-medium truncate">
                        {story.title}
                      </span>
                    </div>
                    {story.finalEstimate && (
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium ml-2">
                        {story.finalEstimate}
                      </span>
                    )}
                  </button>

                  {expandedStories.has(index) && (
                    <div className="px-2 pb-2 space-y-2 text-xs">
                      {story.description && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Description:</span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {story.description}
                          </p>
                        </div>
                      )}
                      {story.acceptanceCriteria && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Acceptance Criteria:
                          </span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {story.acceptanceCriteria}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {story.priority && (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            story.priority === 'CRITICAL'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : story.priority === 'HIGH'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : story.priority === 'MEDIUM'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {story.priority}
                          </span>
                        )}
                        {story.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings Preview */}
          {data.settings && (
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Session Settings
              </span>
              <div className="mt-2 text-xs space-y-1">
                {Object.entries(data.settings).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataPreview;
