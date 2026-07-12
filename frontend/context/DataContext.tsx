import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiService } from '../services/api';

interface DataContextType {
  fetchDashboardData: () => Promise<any>;
  fetchIPCRs: () => Promise<any[]>;
  fetchOPCR: () => Promise<any>;
  fetchNotifications: () => Promise<any[]>;
  refreshData: () => Promise<void>;
  getUnreadCount: () => Promise<number>;
  unreadCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return mock data for development
      return {
        totalIPCRs: 5,
        pendingIPCRs: 2,
        approvedIPCRs: 3,
        completionRate: 60,
      };
    }
  };

  const fetchIPCRs = async () => {
    try {
      const response = await apiService.get('/ipcrs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch IPCRs:', error);
      return [];
    }
  };

  const fetchOPCR = async () => {
    try {
      const response = await apiService.get('/opcr');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch OPCR:', error);
      return null;
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiService.get('/notifications');
      const notificationsData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setNotifications(notificationsData);
      return notificationsData;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  };

  const getUnreadCount = async (): Promise<number> => {
    try {
      const response = await apiService.get('/notifications/unread-count');
      const count = response.data?.count || 0;
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchIPCRs(),
        fetchOPCR(),
        fetchNotifications(),
        getUnreadCount(),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        fetchDashboardData,
        fetchIPCRs,
        fetchOPCR,
        fetchNotifications,
        refreshData,
        getUnreadCount,
        unreadCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
