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
import ThemeToggle from '../ThemeToggle';
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[54px] py-2 sm:py-0 sm:h-20 gap-2">
          {/* Session name + code */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {session.name}
              </h1>
              <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="hidden sm:inline">Code:</span>
                <button
                  onClick={copySessionCode}
                  className={cn(
                    'font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-xs sm:text-sm',
                    'flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                  )}
                >
                  <span>{session.sessionCode}</span>
                  <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                </button>
                {copied && <span className="text-green-600 text-xs">Copied!</span>}
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <ThemeToggle />

              <button
                onClick={onShowTutorial}
                title="Tutorial"
                className={cn(
                  'p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                  'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                )}
              >
                <FontAwesomeIcon icon={faCircleQuestion} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {isModerator && (
                <>
                  <button
                    onClick={onShowExport}
                    title="Export"
                    className={cn(
                      'p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={onShowImport}
                    title="Import"
                    className={cn(
                      'p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faUpload} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={onShowSettings}
                    title="Settings"
                    className={cn(
                      'p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800',
                      'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    )}
                  >
                    <FontAwesomeIcon icon={faGear} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              )}
            </div>

            {isModerator && (
              <UserPresence
                sessionCode={session.sessionCode}
                currentUser={userName}
                users={users}
                session={session}
              />
            )}

            <button
              onClick={onLeave}
              className={cn(
                'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white',
                'p-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700',
                'transition-colors flex items-center gap-1.5',
              )}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline text-sm font-medium">Leave</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
