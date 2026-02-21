import { useEffect } from 'react';
import { useWebSocket } from '../components/websocket/WebSocketProvider';

/**
 * Consolidates all four session WebSocket topic subscriptions.
 *
 * @param {Object}   params
 * @param {string}   params.sessionCode
 * @param {Function} params.onStoryChange    - called with parsed story-topic message
 * @param {Function} params.onReveal         - called with parsed reveal-topic message
 * @param {Function} params.onUserChange     - called with parsed users-topic message
 * @param {Function} params.onTimerSettings  - called with parsed timer-topic message
 */
export function useSessionWebSocket({
  sessionCode,
  onStoryChange,
  onReveal,
  onUserChange,
  onTimerSettings,
}) {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    // Wait until the WebSocket connection is fully established before subscribing.
    // Without this guard, subscribe() returns null (not connected) and subscriptions
    // are never created. Re-running when `connected` changes ensures we subscribe as
    // soon as the connection is ready and re-subscribe after reconnects.
    if (!sessionCode || !connected) return;

    const parse = (handler) => (message) => {
      try {
        const data = JSON.parse(message.body);
        handler(data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    const subs = [
      subscribe(`/topic/session/${sessionCode}/story`,  parse(onStoryChange)),
      subscribe(`/topic/session/${sessionCode}/reveal`, parse(onReveal)),
      subscribe(`/topic/session/${sessionCode}/users`,  parse(onUserChange)),
      subscribe(`/topic/session/${sessionCode}/timer`,  parse(onTimerSettings)),
    ];

    return () => subs.forEach((unsub) => unsub?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode, connected]);
}
