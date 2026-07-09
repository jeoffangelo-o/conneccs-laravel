import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@conneccs_auth_token';
const USER_STORAGE_KEY = '@conneccs_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Replace these with your actual Google OAuth credentials
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleAuthSuccess(authentication);
    }
  }, [response]);

  const loadUserFromStorage = async () => {
    try {
      const [token, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        apiService.setAuthToken(token);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (authentication: any) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      });
      const googleUser = await userInfoResponse.json();

      // Validate email domain
      if (!googleUser.email.endsWith('@cspc.edu.ph')) {
        throw new Error('Only @cspc.edu.ph email addresses are allowed');
      }

      // Send to backend for authentication/registration
      const response = await apiService.post('/auth/google', {
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        googleId: googleUser.sub,
        picture: googleUser.picture,
      });

      const { token, user: userData } = response.data;

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      setUser(userData);
      apiService.setAuthToken(token);

      return { email: googleUser.email };
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      return await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Failed to initiate Google sign-in');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      const { token, user: userData } = response;

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      setUser(userData);
      apiService.setAuthToken(token);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiService.register(userData);
      const { token, user: newUser } = response;

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      setUser(newUser);
      apiService.setAuthToken(token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STORAGE_KEY]);
      apiService.setAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
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
