import { useState, useEffect, ReactNode } from 'react';
import { logoutStudent } from '../lib/auth';
import type { Student, AdminUser } from '../lib/database.types';
import { AuthContext } from './authStore';
import { apiGet } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | AdminUser | null>(null);
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('tpo_user');
      const storedType = localStorage.getItem('tpo_user_type');
      const sessionId = localStorage.getItem('session_id');

      if (!storedUser || !storedType) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as Student | AdminUser;
        const parsedType = storedType as 'student' | 'admin';

        // Rehydrate immediately so refresh does not force logout.
        setUser(parsedUser);
        setUserType(parsedType);

        // Only students have server-side active_session validation.
        if (parsedType === 'student' && sessionId) {
          try {
            const sessionStudent = await apiGet<{ valid: boolean }>(
              `/auth/session/student/${parsedUser.id}?session_id=${encodeURIComponent(sessionId)}`
            );

            if (!sessionStudent.valid) {
              localStorage.removeItem('tpo_user');
              localStorage.removeItem('tpo_user_type');
              localStorage.removeItem('session_id');
              setUser(null);
              setUserType(null);
            }
          } catch (error) {
            // Keep local session on transient network failure.
            console.error('Session validation failed:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('tpo_user');
        localStorage.removeItem('tpo_user_type');
        localStorage.removeItem('session_id');
        setUser(null);
        setUserType(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newUser: Student | AdminUser, type: 'student' | 'admin') => {
    setUser(newUser);
    setUserType(type);
    localStorage.setItem('tpo_user', JSON.stringify(newUser));
    localStorage.setItem('tpo_user_type', type);
  };

  const logout = async () => {
    if (userType === 'student' && user) {
      await logoutStudent(user.id);
    }

    setUser(null);
    setUserType(null);
    localStorage.removeItem('tpo_user');
    localStorage.removeItem('tpo_user_type');
    localStorage.removeItem('session_id');
  };

  return (
    <AuthContext.Provider value={{ user, userType, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
