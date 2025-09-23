import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthAPI } from '../utils/auth/api';
import { AuthStorage } from '../utils/auth/storage';
import { isTokenExpiredBrowser } from '../utils/auth/jwt-browser';
import type { User, AuthContextType } from '../lib/auth/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // 清除错误信息
  const clearError = () => setLastError(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError(); // 清除之前的错误信息
      const response = await AuthAPI.login({ email, password });

      if (response.success && response.user && response.accessToken && response.refreshToken) {
        setUser(response.user);
        AuthStorage.setTokens(response.accessToken, response.refreshToken);
        AuthStorage.setCurrentUser(response.user);
        return true;
      }

      // 将服务器的错误信息存储，供UI组件使用
      if (response.message) {
        setLastError(response.message);
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setLastError('登录失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError(); // 清除之前的错误信息
      const response = await AuthAPI.register({ email, username, password });

      if (response.success && response.user && response.accessToken && response.refreshToken) {
        setUser(response.user);
        AuthStorage.setTokens(response.accessToken, response.refreshToken);
        AuthStorage.setCurrentUser(response.user);
        return true;
      }

      // 将服务器的错误信息存储，供UI组件使用
      if (response.message) {
        setLastError(response.message);
      }

      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      setLastError('注册失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = (): void => {
    setUser(null);
    AuthStorage.clearAuth();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentRefreshToken = AuthStorage.getRefreshToken();
      if (!currentRefreshToken) return false;

      const response = await AuthAPI.refreshToken(currentRefreshToken);

      if (response.success && response.user && response.accessToken && response.refreshToken) {
        setUser(response.user);
        AuthStorage.setTokens(response.accessToken, response.refreshToken);
        AuthStorage.setCurrentUser(response.user);
        return true;
      }

      logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };


  const verifyExistingAuth = async (): Promise<void> => {
    try {
      const storedUser = AuthStorage.getCurrentUser();
      const accessToken = AuthStorage.getAccessToken();
      const refreshTokenValue = AuthStorage.getRefreshToken();

      if (!storedUser || !accessToken || !refreshTokenValue) {
        setIsLoading(false);
        return;
      }

      if (isTokenExpiredBrowser(accessToken)) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        }
      } else {
        const response = await AuthAPI.verifyToken(accessToken);
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyExistingAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const intervalId = setInterval(async () => {
      const accessToken = AuthStorage.getAccessToken();
      if (accessToken && isTokenExpiredBrowser(accessToken)) {
        await refreshToken();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isLoading]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    lastError,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}