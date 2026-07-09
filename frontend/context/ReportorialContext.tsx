import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiService } from '../services/api';

interface ReportorialContextType {
  fetchRequirements: () => Promise<any[]>;
  fetchFolders: (requirementId: string) => Promise<any[]>;
  submitReport: (requirementId: string, data: any) => Promise<void>;
}

const ReportorialContext = createContext<ReportorialContextType | undefined>(undefined);

export const ReportorialProvider = ({ children }: { children: ReactNode }) => {
  const fetchRequirements = async () => {
    try {
      const response = await apiService.get('/reportorial/requirements');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reportorial requirements:', error);
      return [];
    }
  };

  const fetchFolders = async (requirementId: string) => {
    try {
      const response = await apiService.get(`/reportorial/requirements/${requirementId}/folders`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      return [];
    }
  };

  const submitReport = async (requirementId: string, data: any) => {
    try {
      await apiService.post(`/reportorial/requirements/${requirementId}/submit`, data);
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  };

  return (
    <ReportorialContext.Provider
      value={{
        fetchRequirements,
        fetchFolders,
        submitReport,
      }}
    >
      {children}
    </ReportorialContext.Provider>
  );
};

export const useReportorial = () => {
  const context = useContext(ReportorialContext);
  if (!context) {
    throw new Error('useReportorial must be used within ReportorialProvider');
  }
  return context;
};
