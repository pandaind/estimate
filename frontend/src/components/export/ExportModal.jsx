import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCopy, faFileCode, faFileExcel, faXmark, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { exportAPI } from '../../utils/api';
import { handleError } from '../../utils/errorHandler';

/**
 * ExportModal Component
 * Modal for exporting session data in JSON or CSV format
 */
const ExportModal = ({ isOpen, onClose, sessionCode, sessionName }) => {
  const [format, setFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleExport = async (action = 'download') => {
    setLoading(true);
    try {
      const response = await exportAPI.exportSession(sessionCode, format);
      const data = response.data;

      if (action === 'download') {
        const blob = new Blob(
          [format === 'json' ? JSON.stringify(data, null, 2) : data],
          { type: format === 'json' ? 'application/json' : 'text/csv' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sessionName || sessionCode}_export.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (action === 'copy') {
        const textData = format === 'json' ? JSON.stringify(data, null, 2) : data;
        await navigator.clipboard.writeText(textData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (action === 'preview') {
        setPreviewData(data);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewData(null);
    setCopied(false);
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
              <FontAwesomeIcon icon={faDownload} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Export Session Data
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Session: {sessionName || sessionCode}
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
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormat('json')}
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                    format === 'json'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <FileJson className={`w-8 h-8 ${
                    format === 'json' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">JSON</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Complete data structure
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('csv')}
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                    format === 'csv'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <FileSpreadsheet className={`w-8 h-8 ${
                    format === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">CSV</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Tabular format
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Format Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {format === 'json' ? (
                  <>
                    <strong>JSON format</strong> includes complete session data: stories, votes,
                    users, settings, and analytics. Perfect for backup and import.
                  </>
                ) : (
                  <>
                    <strong>CSV format</strong> exports stories and votes in a tabular format.
                    Ideal for spreadsheet analysis and reporting.
                  </>
                )}
              </p>
            </div>

            {/* Preview */}
            {previewData && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono">
                  {format === 'json' ? JSON.stringify(previewData, null, 2) : previewData}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={() => handleExport('preview')}
              disabled={loading}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50"
            >
              Preview
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('copy')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleExport('download')}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin fa-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
