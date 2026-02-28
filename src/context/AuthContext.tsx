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

      if (storedUser && storedType && sessionId) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // For students, verify session is still valid
          if (storedType === 'student') {
            const sessionStudent = await apiGet<{ valid: boolean }>(
              `/auth/session/student/${parsedUser.id}?session_id=${encodeURIComponent(sessionId)}`
            );

            // If session doesn't match, clear local storage
            if (!sessionStudent.valid) {
              localStorage.removeItem('tpo_user');
              localStorage.removeItem('tpo_user_type');
              localStorage.removeItem('session_id');
              setUser(null);
              setUserType(null);
              setIsLoading(false);
              return;
            }
          }

          setUser(parsedUser);
          setUserType(storedType as 'student' | 'admin');
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('tpo_user');
          localStorage.removeItem('tpo_user_type');
          localStorage.removeItem('session_id');
        }
      }

      setIsLoading(false);
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
    // Clear session for student
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
