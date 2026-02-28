import { useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { apiGet } from '../lib/api';

export function useSession() {
  const { user, logout } = useAuth();
  const checkInProgress = useRef(false);

  useEffect(() => {
    if (!user || 'role' in user) return; // Skip for admin

    let isMounted = true;
    const checkSession = async () => {
      // Prevent multiple simultaneous checks
      if (checkInProgress.current) return;
      
      try {
        checkInProgress.current = true;
        const currentSessionId = localStorage.getItem('session_id');
        
        if (!currentSessionId) {
          if (isMounted) await logout();
          return;
        }

        const sessionResult = await apiGet<{ valid: boolean }>(
          `/auth/session/student/${user.id}?session_id=${encodeURIComponent(currentSessionId)}`
        );

        // If session doesn't match, show warning but don't auto-logout immediately
        if (!sessionResult.valid) {
          // Instead of auto-logout, show warning and let user decide
          const shouldLogout = window.confirm(
            'Your session has expired or you have been logged in from another device. Would you like to log out?'
          );
          
          if (shouldLogout && isMounted) {
            await logout();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        checkInProgress.current = false;
      }
    };

    // Check once after 2 seconds (don't check immediately)
    const timer = setTimeout(checkSession, 2000);

    // Then check every 2 minutes instead of 30 seconds
    const intervalId = setInterval(checkSession, 120000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [user, logout]);

  return null;
}
