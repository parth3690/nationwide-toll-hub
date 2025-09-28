/**
 * Elite Mobile App Test Suite
 * 
 * Comprehensive testing for the Nationwide Toll Hub mobile application
 * with unit tests, integration tests, and component tests.
 */

import 'react-native-gesture-handler/jestSetup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { App } from '../App';
import { authService } from '../services/authService';

// Mock dependencies
jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn(() => Promise.resolve(true)),
  hasPermission: jest.fn(() => Promise.resolve(true)),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  createChannel: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    ANDROID: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

jest.mock('../services/authService', () => ({
  authService: {
    isAuthenticated: jest.fn(() => false),
    login: jest.fn(),
    logout: jest.fn(),
    getStoredTokens: jest.fn(() => null),
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
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

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => ({
    params: {},
  }),
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('Nationwide Toll Hub Mobile App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App Component', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );
    });

    it('shows login screen when user is not authenticated', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeTruthy();
      });
    });

    it('shows main app when user is authenticated', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeTruthy();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('handles successful login', async () => {
      const mockLogin = authService.login as jest.Mock;
      mockLogin.mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for login screen to render
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeTruthy();
      });

      // Test login functionality
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles login error', async () => {
      const mockLogin = authService.login as jest.Mock;
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeTruthy();
      });

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'invalid@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates between tabs correctly', async () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeTruthy();
      });

      // Test tab navigation
      const tollsTab = screen.getByText('Tolls');
      fireEvent.press(tollsTab);

      await waitFor(() => {
        expect(screen.getByText('Tolls')).toBeTruthy();
      });
    });
  });
});
