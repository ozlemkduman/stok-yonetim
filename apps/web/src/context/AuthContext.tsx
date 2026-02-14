import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, User, Tenant, LoginData, RegisterData } from '../api/auth.api';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: (User & { tenant?: Tenant }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User & { tenant?: Tenant }>;
  register: (data: RegisterData) => Promise<User & { tenant?: Tenant }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { tenant?: Tenant }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getProfile();
      setUser(response.data);
    } catch {
      apiClient.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for logout events from API client
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [refreshUser]);

  const login = async (data: LoginData): Promise<User & { tenant?: Tenant }> => {
    const response = await authApi.login(data);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (data: RegisterData): Promise<User & { tenant?: Tenant }> => {
    const response = await authApi.register(data);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const setTokens = async (accessToken: string, refreshToken: string): Promise<User | null> => {
    apiClient.setTokens(accessToken, refreshToken);
    if (!apiClient.isAuthenticated()) {
      return null;
    }
    try {
      const response = await authApi.getProfile();
      setUser(response.data);
      return response.data;
    } catch {
      apiClient.clearTokens();
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
