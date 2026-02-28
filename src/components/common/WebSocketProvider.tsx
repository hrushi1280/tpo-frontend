import type { ReactNode } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}
