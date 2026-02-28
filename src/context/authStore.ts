import { createContext } from 'react';
import type { Student, AdminUser } from '../lib/database.types';

export interface AuthContextType {
  user: Student | AdminUser | null;
  userType: 'student' | 'admin' | null;
  isLoading: boolean;
  login: (user: Student | AdminUser, type: 'student' | 'admin') => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
