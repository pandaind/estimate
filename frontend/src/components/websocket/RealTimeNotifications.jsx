import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUserPlus, faUserMinus, faVoteYea, faEye, faArrowRotateLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from './WebSocketProvider';

/**
 * RealTimeNotifications Component
 * Display toast notifications for real-time events
 */
const RealTimeNotifications = ({ sessionCode, currentUserId }) => {
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = React.useState([]);

  useEffect(() => {
    if (!sessionCode) return;

    // Subscribe to various event topics
    const unsubscribers = [];

    // User joined event
    unsubscribers.push(
      subscribe('/user-joined', (data) => {
        if (data.userId !== currentUserId) {
          addNotification({
            id: Date.now(),
            type: 'user-joined',
            icon: faUserPlus,
            color: 'green',
            message: `${data.userName} joined the session`,
          });
        }
      })
    );

    // User left event
    unsubscribers.push(
      subscribe('/user-left', (data) => {
        if (data.userId !== currentUserId) {
          addNotification({
            id: Date.now(),
            type: 'user-left',
            icon: faUserMinus,
            color: 'orange',
            message: `${data.userName} left the session`,
          });
        }
      })
    );

    // Vote cast event
    unsubscribers.push(
      subscribe('/vote-cast', (data) => {
        if (data.userId !== currentUserId) {
          addNotification({
            id: Date.now(),
            type: 'vote-cast',
            icon: faVoteYea,
            color: 'blue',
            message: `${data.userName} voted`,
            autoHide: true,
          });
        }
      })
    );

    // Votes revealed event
    unsubscribers.push(
      subscribe('/votes-revealed', () => {
        addNotification({
          id: Date.now(),
          type: 'votes-revealed',
          icon: faEye,
          color: 'purple',
          message: 'Votes have been revealed!',
        });
      })
    );

    // Votes reset event
    unsubscribers.push(
      subscribe('/votes-reset', () => {
        addNotification({
          id: Date.now(),
          type: 'votes-reset',
          icon: faArrowRotateLeft,
          color: 'gray',
          message: 'Votes have been reset',
        });
      })
    );

    // Story finalized event
    unsubscribers.push(
      subscribe('/story-finalized', (data) => {
        addNotification({
          id: Date.now(),
          type: 'story-finalized',
          icon: faCircleCheck,
          color: 'green',
          message: `Story "${data.storyTitle}" finalized: ${data.finalEstimate}`,
        });
      })
    );

    // Story created event
    unsubscribers.push(
      subscribe('/story-created', (data) => {
        addNotification({
          id: Date.now(),
          type: 'story-created',
          icon: faCircleCheck,
          color: 'blue',
          message: `New story: "${data.storyTitle}"`,
        });
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [sessionCode, currentUserId, subscribe]);

  const addNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);

    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 3000);
    } else {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-800 dark:text-green-300',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-800 dark:text-purple-300',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-800 dark:text-orange-300',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'text-gray-600 dark:text-gray-400',
      text: 'text-gray-800 dark:text-gray-300',
    },
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const colors = colorClasses[notification.color] || colorClasses.blue;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 flex items-start space-x-3`}
            >
              <FontAwesomeIcon icon={notification.icon} className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
              <p className={`flex-1 ${colors.text} font-medium text-sm`}>
                {notification.message}
              </p>
              <button
                onClick={() => removeNotification(notification.id)}
                className={`${colors.icon} hover:opacity-70 transition-opacity`}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeNotifications;
