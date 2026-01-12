import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { tokenManager } from '../../utils/api';

/**
 * WebSocketContext
 * Provides WebSocket connection and messaging functionality
 */
const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * WebSocketProvider Component
 * Manages WebSocket connection lifecycle and message subscriptions
 */
export const WebSocketProvider = ({ children, sessionCode }) => {
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState(null);
  const subscriptionsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionCode) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    const token = tokenManager.get();
    
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
      onConnect: () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame);
        handleReconnect();
      },
      onWebSocketError: (error) => {
        console.error('[WebSocket] WebSocket error:', error);
        handleReconnect();
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stompClient.deactivate();
    };
  }, [sessionCode]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      client?.activate();
    }, RECONNECT_DELAY * reconnectAttemptsRef.current);
  }, [client]);

  // Subscribe to a topic
  const subscribe = useCallback(
    (topic, callback) => {
      if (!client || !connected) {
        return null;
      }

      const fullTopic = topic.startsWith('/topic') ? topic : `/topic${topic}`;
      
      const subscription = client.subscribe(fullTopic, (message) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[WebSocket] Error in callback:', error);
        }
      });

      subscriptionsRef.current.set(topic, subscription);

      return () => {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(topic);
      };
    },
    [client, connected]
  );

  const value = {
    connected,
    subscribe,
    client,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
