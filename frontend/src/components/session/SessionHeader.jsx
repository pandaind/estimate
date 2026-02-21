import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faGear,
  faRightFromBracket,
  faDownload,
  faUpload,
  faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons';
import UserPresence from '../websocket/UserPresence';
import { cn } from '../../utils/cn';

/**
 * Top header bar: session name/code, action buttons, user presence, leave button.
 */
export default function SessionHeader({
  session,
  userName,
  users,
  isModerator,
  onLeave,
  onShowSettings,
  onShowExport,
  onShowImport,
  onShowTutorial,
}) {
  const [copied, setCopied] = useState(false);

  const copySessionCode = async () => {
    try {
      await navigator.clipboard.writeText(session.sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      /* clipboard not available */
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-24">
          {/* Session name + code */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>Code:</span>
                <button
                  onClick={copySessionCode}
                  className={cn(
                    'font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg',
                    'flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                  )}
                >
                  <span>{session.sessionCode}</span>
                  <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                </button>
                {copied && <span className="text-green-600 text-xs">Copied!</span>}
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={onShowTutorial}
                title="Tutorial"
                className={cn(
                  'p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                  'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                )}
              >
                <FontAwesomeIcon icon={faCircleQuestion} className="w-5 h-5" />
              </button>

              {isModerator && (
                <>
                  <button
                    onClick={onShowExport}
                    title="Export"
                    className={cn(
                      'p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onShowImport}
                    title="Import"
                    className={cn(
                      'p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onShowSettings}
                    title="Settings"
                    className={cn(
                      'p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {isModerator && (
              <div className="mt-1">
                <UserPresence
                  sessionCode={session.sessionCode}
                  currentUser={userName}
                  users={users}
                  session={session}
                />
              </div>
            )}

            <button
              onClick={onLeave}
              className={cn(
                'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white',
                'px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700',
                'transition-colors flex items-center space-x-2',
              )}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
