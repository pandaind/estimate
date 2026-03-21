import { useWebSocket } from './WebSocketProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Displays a banner when the WebSocket connection is lost.
 * Automatically hides when reconnected.
 */
export default function ConnectionStatus() {
  const { connected } = useWebSocket();

  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 overflow-hidden"
          role="alert"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-center space-x-2 text-sm text-yellow-800 dark:text-yellow-200">
            <FontAwesomeIcon icon={faWifi} className="w-4 h-4 animate-pulse" />
            <span>Reconnecting to server&hellip;</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
