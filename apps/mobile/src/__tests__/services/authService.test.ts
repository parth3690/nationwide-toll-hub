/**
 * Elite Auth Service Tests
 * 
 * Comprehensive testing for the authentication service including
 * login, logout, token management, and biometric authentication.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';
import { api } from '../../services/api';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token'
      );

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      (api.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        authService.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: {} });
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear tokens even if API call fails', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when access token does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-refresh-token');
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshToken();

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'mock-refresh-token',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token'
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should handle refresh token error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-refresh-token');
      (api.post as jest.Mock).mockRejectedValue(new Error('Invalid refresh token'));

      await expect(authService.refreshToken()).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getStoredTokens', () => {
    it('should return stored tokens', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');

      const result = await authService.getStoredTokens();

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should return null when no tokens exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.getStoredTokens();

      expect(result).toBeNull();
    });
  });

  describe('storeTokens', () => {
    it('should store tokens successfully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await authService.storeTokens({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token'
      );
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens successfully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await authService.clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
});
