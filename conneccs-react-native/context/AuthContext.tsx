import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import usersData from '../assets/data/users.json';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAutoGenerateIPCR: (callback: (userId: string) => Promise<void>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@conneccs_auth_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoGenerateIPCR, setAutoGenerateIPCRCallback] = useState<((userId: string) => Promise<void>) | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAutoGenerateIPCR = (callback: (userId: string) => Promise<void>) => {
    setAutoGenerateIPCRCallback(() => callback);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = usersData.find(
      u => u.email === email && u.password === password
    );
    
    if (foundUser) {
      setUser(foundUser as User);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
        
        // Auto-generate IPCR for faculty, secretaries, and coordinators on login
        if ((foundUser.role === 'FACULTY' || foundUser.role === 'SECRETARY' || foundUser.role === 'COORDINATOR' || foundUser.role === 'CHAIR') && autoGenerateIPCR) {
          try {
            await autoGenerateIPCR(foundUser.id);
            console.log('Auto-generated IPCR for user:', foundUser.name);
          } catch (error) {
            console.error('Failed to auto-generate IPCR:', error);
          }
        }
      } catch (error) {
        console.error('Failed to save user to storage:', error);
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove user from storage:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, setAutoGenerateIPCR }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
