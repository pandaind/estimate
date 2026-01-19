import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileCode, faXmark, faCircleExclamation, faCircleCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { storyAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';
import DataPreview from './DataPreview';

/**
 * ImportModal Component
 * Modal for importing stories into current session from JSON
 */
const ImportModal = ({ isOpen, onClose, onImportSuccess, sessionCode }) => {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState('file'); // 'file' or 'paste'

  const validateData = (data) => {
    try {
      // Basic validation
      if (!data || typeof data !== 'object') {
        return 'Invalid data format';
      }

      if (!data.stories || !Array.isArray(data.stories)) {
        return 'Data must contain a stories array';
      }

      // Validate each story has required fields
      for (const story of data.stories) {
        if (!story.title) {
          return 'All stories must have a title';
        }
      }

      return null;
    } catch (err) {
      return 'Failed to validate data: ' + err.message;
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setValidationError('Please select a JSON file');
      return;
    }

    setFile(selectedFile);
    setValidationError(null);

    // Read and parse file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const error = validateData(data);
        
        if (error) {
          setValidationError(error);
          setParsedData(null);
        } else {
          setParsedData(data);
          setValidationError(null);
        }
      } catch (err) {
        setValidationError('Invalid JSON format');
        setParsedData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleJsonPaste = () => {
    try {
      const data = JSON.parse(jsonData);
      const error = validateData(data);
      
      if (error) {
        setValidationError(error);
        setParsedData(null);
      } else {
        setParsedData(data);
        setValidationError(null);
      }
    } catch (err) {
      setValidationError('Invalid JSON format');
      setParsedData(null);
    }
  };

  const handleImport = async () => {
    if (!parsedData || !sessionCode) return;

    setLoading(true);
    try {
      // Import stories into current session
      const stories = parsedData.stories || [];
      const importedCount = stories.length;
      
      // Add each story to the current session
      for (const story of stories) {
        await storyAPI.create(sessionCode, {
          title: story.title,
          description: story.description || '',
          acceptanceCriteria: story.acceptanceCriteria || '',
          tags: Array.isArray(story.tags) ? story.tags : [],
          priority: story.priority || 'MEDIUM'
        });
      }
      
      onImportSuccess?.(importedCount);
      handleClose();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setJsonData('');
    setParsedData(null);
    setValidationError(null);
    setImportMode('file');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faUpload} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Import Stories
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Import stories from JSON into current session
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Import Mode Selection */}
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setImportMode('file')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  importMode === 'file'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setImportMode('paste')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  importMode === 'paste'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                Paste JSON
              </button>
            </div>

            {/* File Upload Mode */}
            {importMode === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select JSON File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                  <FontAwesomeIcon icon={faFileCode} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Choose file
                  </label>
                  <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                  {file && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Paste Mode */}
            {importMode === 'paste' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Paste JSON Data
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='{"stories": [...], "settings": {...}}'
                  className="w-full h-48 px-4 py-3 bg-gray-900 text-green-400 font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleJsonPaste}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Validate JSON
                </button>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">Validation Error</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{validationError}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {parsedData && !validationError && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
                <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">Valid Data</p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {parsedData.stories.length} stories ready to import
                  </p>
                </div>
              </div>
            )}

            {/* Data Preview */}
            {parsedData && (
              <DataPreview data={parsedData} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedData || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin fa-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                  <span>Import Stories</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImportModal;
