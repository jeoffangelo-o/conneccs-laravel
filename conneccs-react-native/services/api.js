import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'  // Development
  : 'https://your-production-url.com/api';  // Production

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear auth
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (data) => 
    api.post('/auth/register', data),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getUser: () => 
    api.get('/auth/user'),
};

// IPCR APIs
export const ipcrAPI = {
  getAll: (params) => 
    api.get('/ipcrs', { params }),
  
  getById: (id) => 
    api.get(`/ipcrs/${id}`),
  
  create: (data) => 
    api.post('/ipcrs', data),
  
  update: (id, data) => 
    api.put(`/ipcrs/${id}`, data),
  
  delete: (id) => 
    api.delete(`/ipcrs/${id}`),
  
  submitTarget: (ipcrId, targetId, data) => 
    api.post(`/ipcrs/${ipcrId}/targets/${targetId}/submit`, data),
  
  getFacultyIPCRs: (userId) => 
    api.get(`/ipcrs/faculty/${userId}`),
};

// OPCR APIs
export const opcrAPI = {
  get: () => 
    api.get('/opcr'),
  
  update: (data) => 
    api.put('/opcr', data),
  
  uploadExcel: (formData) => 
    api.post('/opcr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Target Workflow APIs
export const targetAPI = {
  coordinatorEndorse: (targetId, note) => 
    api.post(`/targets/${targetId}/coordinator-endorse`, { note }),
  
  coordinatorReturn: (targetId, note) => 
    api.post(`/targets/${targetId}/coordinator-return`, { note }),
  
  secretaryRate: (targetId, q, e, t) => 
    api.post(`/targets/${targetId}/secretary-rate`, { q, e, t }),
  
  secretaryReturn: (targetId, note) => 
    api.post(`/targets/${targetId}/secretary-return`, { note }),
  
  deanApprove: (targetId) => 
    api.post(`/targets/${targetId}/dean-approve`),
  
  deanOverride: (targetId, q, e, t, remarks) => 
    api.post(`/targets/${targetId}/dean-override`, { q, e, t, remarks }),
  
  deanReturn: (targetId, remarks) => 
    api.post(`/targets/${targetId}/dean-return`, { remarks }),
};

// Queue APIs
export const queueAPI = {
  getSecretaryQueue: () => 
    api.get('/queues/secretary'),
  
  getCoordinatorQueue: (type) => 
    api.get('/queues/coordinator', { params: { type } }),
  
  getDeanQueue: () => 
    api.get('/queues/dean'),
  
  getComplianceDashboard: () => 
    api.get('/queues/compliance-dashboard'),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => 
    api.get('/notifications'),
  
  markAsRead: (id) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.post('/notifications/mark-all-read'),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),
};

// Document APIs
export const documentAPI = {
  upload: (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getById: (id) => 
    api.get(`/documents/${id}`),
  
  delete: (id) => 
    api.delete(`/documents/${id}`),
};

// Message APIs
export const messageAPI = {
  getAll: () => 
    api.get('/messages'),
  
  send: (recipientId, content, attachments) => 
    api.post('/messages', { recipientId, content, attachments }),
  
  markAsRead: (id) => 
    api.put(`/messages/${id}/read`),
};

// Reportorial APIs
export const reportorialAPI = {
  getRequirements: () => 
    api.get('/reportorial/requirements'),
  
  getFolders: (requirementId) => 
    api.get(`/reportorial/requirements/${requirementId}/folders`),
  
  submitDocument: (folderId, data) => 
    api.post(`/reportorial/folders/${folderId}/submit`, data),
};

export default api;
