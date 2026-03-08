import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/useAuth';

type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

type UseWebSocketOptions = {
  onMessage?: (data: WebSocketMessage) => void;
  onNotice?: (notice: WebSocketMessage) => void;
  onChatMessage?: (message: WebSocketMessage) => void;
  onTyping?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
};

const rawWsUrl = import.meta.env.VITE_WS_URL || '';
const fallbackWsFromApi = (import.meta.env.VITE_API_URL || '').replace(/^http/, 'ws');
const WS_BASE_URL = rawWsUrl || fallbackWsFromApi || (import.meta.env.DEV ? 'ws://localhost:8000' : '');

if (!WS_BASE_URL) {
  throw new Error('Missing WebSocket base URL. Set VITE_WS_URL in environment variables.');
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user, userType } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);

  optionsRef.current = options;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!user?.id || !userType) return;

    const wsUrl = `${WS_BASE_URL}/ws/${user.id}/${userType}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      optionsRef.current.onConnect?.();

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'ping',
              timestamp: Date.now(),
            })
          );
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;

        switch (data.type) {
          case 'pong':
            if (typeof data.timestamp === 'number') {
              setLastPong(data.timestamp);
            }
            break;
          case 'notice':
            optionsRef.current.onNotice?.(data);
            break;
          case 'message':
            optionsRef.current.onChatMessage?.(data);
            break;
          case 'typing':
            optionsRef.current.onTyping?.(data);
            break;
          default:
            optionsRef.current.onMessage?.(data);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      optionsRef.current.onError?.(error);
    };

    wsRef.current = ws;
  }, [user?.id, userType]);

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const sendNotice = useCallback(
    (title: string, content: string, priority: string = 'NORMAL') => {
      return sendMessage({
        type: 'notice',
        title,
        content,
        priority,
      });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (message: string, receiverId?: string) => {
      return sendMessage({
        type: 'message',
        message,
        ...(receiverId ? { receiver_id: receiverId } : {}),
      });
    },
    [sendMessage]
  );

  const sendTyping = useCallback(
    (isTyping: boolean, studentId?: string) => {
      return sendMessage({
        type: 'typing',
        is_typing: isTyping,
        ...(studentId ? { student_id: studentId } : {}),
      });
    },
    [sendMessage]
  );

  const markAsRead = useCallback(
    (studentId?: string) => {
      return sendMessage({
        type: 'mark_read',
        ...(studentId ? { student_id: studentId } : {}),
      });
    },
    [sendMessage]
  );

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  return {
    isConnected,
    lastPong,
    sendMessage,
    sendNotice,
    sendChatMessage,
    sendTyping,
    markAsRead,
    disconnect,
    reconnect: connect,
  };
}
