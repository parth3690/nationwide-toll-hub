/**
 * Elite API Service for Nationwide Toll Hub Mobile App
 * 
 * Comprehensive API client with authentication, error handling,
 * request/response interceptors, and offline support.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiResponse, ApiError, AuthState } from '../types';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Version': '1.0.0',
        'X-Platform': 'mobile',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication token
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw new Error('No internet connection');
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate response time
        const responseTime = Date.now() - response.config.metadata?.startTime;
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${responseTime}ms)`);

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              this.processQueue(null);
              return this.client(originalRequest);
            } else {
              this.processQueue(error);
              await this.logout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        code: error.response.data?.code || 'SERVER_ERROR',
        message: error.response.data?.message || error.message,
        details: error.response.data?.details,
        timestamp: new Date(),
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        timestamp: new Date(),
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get stored access token
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        return null;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      await AsyncStorage.setItem('access_token', accessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  private async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * Upload file
   */
  async upload<T>(url: string, file: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Download file
   */
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Set authentication tokens
   */
  async setAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['access_token', tokens.accessToken],
        ['refresh_token', tokens.refreshToken],
      ]);
    } catch (error) {
      console.error('Error setting auth tokens:', error);
      throw error;
    }
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
      throw error;
    }
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(
    onFulfilled?: (value: any) => any,
    onRejected?: (error: any) => any
  ): number {
    return this.client.interceptors.request.use(onFulfilled, onRejected);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(
    onFulfilled?: (value: any) => any,
    onRejected?: (error: any) => any
  ): number {
    return this.client.interceptors.response.use(onFulfilled, onRejected);
  }

  /**
   * Remove interceptor
   */
  removeInterceptor(type: 'request' | 'response', id: number): void {
    if (type === 'request') {
      this.client.interceptors.request.eject(id);
    } else {
      this.client.interceptors.response.eject(id);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
