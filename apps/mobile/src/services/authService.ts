/**
 * Elite Authentication Service for Nationwide Toll Hub Mobile App
 * 
 * Comprehensive authentication service with biometric support,
 * secure token management, and offline capabilities.
 */

import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthState, MobileUser } from '../types';
import { ApiResponse } from '../types';

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    tokens: null,
    error: null,
    biometricEnabled: false,
  };

  private constructor() {
    this.initializeAuthState();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication state from storage
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const [accessToken, refreshToken, userData, biometricEnabled] = await AsyncStorage.multiGet([
        'access_token',
        'refresh_token',
        'user_data',
        'biometric_enabled',
      ]);

      if (accessToken[1] && refreshToken[1]) {
        this.authState = {
          ...this.authState,
          isAuthenticated: true,
          tokens: {
            accessToken: accessToken[1],
            refreshToken: refreshToken[1],
          },
          user: userData[1] ? JSON.parse(userData[1]) : null,
          biometricEnabled: biometricEnabled[1] === 'true',
        };
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: MobileUser; tokens: any }>> {
    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      const response = await apiService.post<{ user: MobileUser; tokens: any }>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.success) {
        const { user, tokens } = response.data;

        // Store tokens and user data
        await this.setAuthData(user, tokens);

        // Store biometric preference
        if (credentials.biometric) {
          await AsyncStorage.setItem('biometric_enabled', 'true');
          this.authState.biometricEnabled = true;
        }

        this.authState = {
          ...this.authState,
          isAuthenticated: true,
          user,
          tokens,
          isLoading: false,
        };

        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      this.authState.error = error instanceof Error ? error.message : 'Login failed';
      this.authState.isLoading = false;
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<ApiResponse<{ user: MobileUser; tokens: any }>> {
    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      const response = await apiService.post<{ user: MobileUser; tokens: any }>('/auth/signup', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        acceptTerms: userData.acceptTerms,
        marketingOptIn: userData.marketingOptIn,
      });

      if (response.success) {
        const { user, tokens } = response.data;

        // Store tokens and user data
        await this.setAuthData(user, tokens);

        this.authState = {
          ...this.authState,
          isAuthenticated: true,
          user,
          tokens,
          isLoading: false,
        };

        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      this.authState.error = error instanceof Error ? error.message : 'Registration failed';
      this.authState.isLoading = false;
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiService.post('/auth/logout');

      // Clear local storage
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_data',
        'biometric_enabled',
      ]);

      // Reset auth state
      this.authState = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null,
        biometricEnabled: false,
      };
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local data even if API call fails
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_data',
        'biometric_enabled',
      ]);

      this.authState = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null,
        biometricEnabled: false,
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.authState.tokens?.refreshToken;
      if (!refreshToken) {
        return null;
      }

      const response = await apiService.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });

      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update stored tokens
        await AsyncStorage.multiSet([
          ['access_token', accessToken],
          ['refresh_token', newRefreshToken],
        ]);

        // Update auth state
        this.authState.tokens = {
          accessToken,
          refreshToken: newRefreshToken,
        };

        return accessToken;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logout();
      return null;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<ApiResponse<{ verified: boolean }>> {
    try {
      const response = await apiService.post('/auth/verify-otp', {
        email,
        otp,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      const response = await apiService.post('/auth/resend-otp', {
        email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      const response = await apiService.post('/auth/forgot-password', {
        email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        newPassword,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enable MFA
   */
  async enableMFA(method: 'totp' | 'sms'): Promise<ApiResponse<{ secret?: string; qrCode?: string }>> {
    try {
      const response = await apiService.post('/auth/mfa/enable', {
        method,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(code: string): Promise<ApiResponse<{ verified: boolean }>> {
    try {
      const response = await apiService.post('/auth/mfa/verify', {
        code,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable MFA
   */
  async disableMFA(): Promise<ApiResponse<{ disabled: boolean }>> {
    try {
      const response = await apiService.post('/auth/mfa/disable');

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<MobileUser>> {
    try {
      const response = await apiService.get<MobileUser>('/auth/me');

      if (response.success) {
        this.authState.user = response.data;
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<MobileUser>): Promise<ApiResponse<MobileUser>> {
    try {
      const response = await apiService.put<MobileUser>('/auth/profile', updates);

      if (response.success) {
        this.authState.user = { ...this.authState.user, ...response.data };
        await AsyncStorage.setItem('user_data', JSON.stringify(this.authState.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      this.authState.biometricEnabled = true;
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('biometric_enabled');
      this.authState.biometricEnabled = false;
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }

  /**
   * Check if biometric is enabled
   */
  isBiometricEnabled(): boolean {
    return this.authState.biometricEnabled;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUserSync(): MobileUser | null {
    return this.authState.user;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.authState.tokens?.accessToken || null;
  }

  /**
   * Set authentication data
   */
  private async setAuthData(user: MobileUser, tokens: any): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['access_token', tokens.accessToken],
        ['refresh_token', tokens.refreshToken],
        ['user_data', JSON.stringify(user)],
      ]);

      // Set tokens in API service
      await apiService.setAuthTokens(tokens);
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw error;
    }
  }

  /**
   * Clear authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_data',
      ]);

      await apiService.clearAuthTokens();
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
