import type { Student, AdminUser } from './database.types';
import { apiPost } from './api';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: Student | AdminUser;
  userType?: 'student' | 'admin';
}

export async function loginStudent(prn: string, password: string): Promise<AuthResponse> {
  try {
    if (!prn || !password) {
      return { success: false, message: 'Please enter PRN and password' };
    }

    const response = await apiPost<{
      success: boolean;
      message?: string;
      user?: Student;
      userType?: 'student';
      session_id?: string;
    }>('/auth/login/student', {
      prn: prn.trim().toUpperCase(),
      password,
      device: navigator.userAgent,
    });

    if (!response.success || !response.user || !response.session_id) {
      return { success: false, message: response.message || 'Invalid PRN or password' };
    }
    localStorage.setItem('session_id', response.session_id);

    return {
      success: true,
      message: response.message || undefined,
      user: response.user,
      userType: 'student',
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed. Please check your connection and try again.' };
  }
}

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  try {
    if (!email || !password) {
      return { success: false, message: 'Please enter email and password' };
    }

    const response = await apiPost<{
      success: boolean;
      message?: string;
      user?: AdminUser;
      userType?: 'admin';
    }>('/auth/login/admin', {
      email: email.trim().toLowerCase(),
      password,
    });

    if (!response.success || !response.user) {
      return { success: false, message: response.message || 'Invalid email or password' };
    }

    return {
      success: true,
      user: response.user,
      userType: 'admin',
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed. Please check your connection and try again.' };
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = Array.from(new Uint8Array(digest));
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}

export async function logoutStudent(studentId: string) {
  try {
    const sessionId = localStorage.getItem('session_id') || '';
    await apiPost('/auth/logout/student', { student_id: studentId, session_id: sessionId });
    
    localStorage.removeItem('session_id');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function registerStudent(data: {
  prn: string;
  password: string;
  full_name: string;
  email: string;
  phone: string;
  branch: string;
  batch_year: number;
  graduation_year: number;
}): Promise<AuthResponse> {
  try {
    const response = await apiPost<AuthResponse>('/auth/register/student', data);
    if (!response.success) {
      return { success: false, message: response.message || 'Registration failed. Please try again.' };
    }

    return {
      success: true,
      message: 'Registration successful! Please wait for admin approval before logging in.',
      userType: 'student',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed. Please try again.' };
  }
}
