// Axios API client with interceptors
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { getToken, clearAuth } from '../storage/secureStorage';
import { ApiError } from '../../types/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      await clearAuth();
      // Navigation will be handled in AuthContext
    }
    
    // Format error for consistency
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
    };
    
    return Promise.reject(apiError);
  }
);

export default apiClient;

// Helper functions for common request patterns
export const get = <T = any>(url: string, config?: AxiosRequestConfig) => 
  apiClient.get<T>(url, config).then(res => res.data);

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiClient.post<T>(url, data, config).then(res => res.data);

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiClient.put<T>(url, data, config).then(res => res.data);

export const del = <T = any>(url: string, config?: AxiosRequestConfig) => 
  apiClient.delete<T>(url, config).then(res => res.data);

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiClient.patch<T>(url, data, config).then(res => res.data);
