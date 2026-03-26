import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from './types';

// Get config from env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5197';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Cache for log deduplication (throttling)
const lastRequestLogs = new Map<string, number>();
const LOG_THROTTLE_MS = 100;

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (Firebase ID token)
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const logKey = `${method}:${url}`;
    const now = Date.now();

    // Deduplicate rapid-fire identical requests (mostly for React Strict Mode / re-renders)
    if (lastRequestLogs.has(logKey) && now - lastRequestLogs.get(logKey)! < LOG_THROTTLE_MS) {
      return config;
    }
    lastRequestLogs.set(logKey, now);

    const color = method === 'GET' ? '#2196F3' : method === 'POST' ? '#4CAF50' : '#FF9800';
    
    console.log(
      `%c🌐 API ${method}%c ${config.url}`,
      `color: white; background: ${color}; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
      'color: inherit;'
    );
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const status = response.status;
    const url = response.config.url;
    
    console.groupCollapsed(
      `%c✅ API ${status}%c ${url}`,
      'color: #4CAF50; font-weight: bold;',
      'color: inherit;'
    );
    console.log('Data:', response.data);
    console.log('Config:', response.config);
    console.groupEnd();
    
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || 'unknown';

      console.group(
        `%c❌ API ${status}%c ${url}`,
        'color: #F44336; font-weight: bold;',
        'color: inherit;'
      );
      console.error('Error Details:', error.response.data);
      console.groupEnd();
    } else {
      console.error('❌ Network/Request Error:', error.message);
    }

    // Handle specific errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized - Token expired or invalid');
          break;
        case 404:
          console.error('Not Found:', data.message);
          break;
        case 500:
          console.error('Server Error:', data.message);
          break;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return 'Unknown error occurred';
};