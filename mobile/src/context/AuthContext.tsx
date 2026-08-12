import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, clearTokens } from '../services/api';

interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  business_name: string;
  phone?: string;
  address?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name: string,
    last_name: string,
    phone: string,
    business_name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await authAPI.getUserInfo();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    await authAPI.login(usernameOrEmail, password);
    const userData = await authAPI.getUserInfo();
    setUser(userData);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name: string,
    last_name: string,
    phone: string,
    business_name: string,
  ) => {
    await authAPI.register(username, email, password, password2, first_name, last_name, phone, business_name);
    // After registration, user needs to login
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getUserInfo();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isStaff: !!user?.is_staff || !!user?.is_superuser,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
