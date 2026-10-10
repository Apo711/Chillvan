import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/index.js';
import { api, authStorage } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  systemStatus: { hasTeacher: boolean; teacherCount: number; studentCount: number } | null;
  loginTeacher: (email: string, pass: string) => Promise<void>;
  loginStudent: (username: string, pass: string) => Promise<void>;
  setupTeacher: (email: string, fullName: string, pass: string, securityKey?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<{ hasTeacher: boolean; teacherCount: number; studentCount: number } | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await api.getStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to get system status', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.warn('Session expired or invalid token', err);
      authStorage.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshUser();
  }, [refreshStatus, refreshUser]);

  const loginTeacher = async (email: string, pass: string) => {
    const res = await api.teacherLogin(email, pass);
    authStorage.setToken(res.token);
    setUser(res.user);
    await refreshStatus();
  };

  const loginStudent = async (username: string, pass: string) => {
    const res = await api.studentLogin(username, pass);
    authStorage.setToken(res.token);
    setUser(res.user);
    await refreshStatus();
  };

  const setupTeacher = async (email: string, fullName: string, pass: string, securityKey?: string) => {
    const res = await api.setupTeacher({ email, fullName, password: pass, securityKey });
    authStorage.setToken(res.token);
    setUser(res.user);
    await refreshStatus();
  };

  const logout = () => {
    authStorage.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        systemStatus,
        loginTeacher,
        loginStudent,
        setupTeacher,
        logout,
        refreshUser,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
