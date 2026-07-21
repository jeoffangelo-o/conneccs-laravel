import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.15:8000/api';

class ApiService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          // Handle specific error codes
          if (status === 401) {
            // Unauthorized - clear token and redirect to login
            this.setAuthToken(null);
          } else if (status === 403) {
            throw new Error(data.message || 'Access forbidden');
          } else if (status === 404) {
            throw new Error(data.message || 'Resource not found');
          } else if (status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          
          throw new Error(data.message || 'An error occurred');
        } else if (error.request) {
          throw new Error('Network error. Please check your connection.');
        }
        
        throw error;
      }
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  // Generic CRUD methods
  async get(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.get(endpoint, config);
  }

  async post(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(endpoint, data, config);
  }

  async put(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(endpoint, data, config);
  }

  async patch(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch(endpoint, data, config);
  }

  async delete(endpoint: string, config?: AxiosRequestConfig) {
    return this.client.delete(endpoint, config);
  }

  // File upload
  async uploadFile(endpoint: string, file: File | Blob, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

export const apiService = new ApiService();
