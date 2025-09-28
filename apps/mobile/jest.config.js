/**
 * Elite Jest Configuration for Mobile App
 * 
 * Comprehensive testing configuration with coverage, mocking,
 * and React Native specific setup.
 */

module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-linear-gradient|react-native-svg|react-native-chart-kit|react-native-paper|react-native-elements|react-native-image-picker|react-native-document-picker|react-native-share|react-native-device-info|react-native-keychain|react-native-biometrics|react-native-push-notification|@react-native-firebase|react-native-permissions|react-native-camera|react-native-qrcode-scanner|@react-native-async-storage|react-native-netinfo|react-native-splash-screen|react-native-skeleton-placeholder|react-native-modal|react-native-toast-message|react-native-loading-spinner-overlay|react-native-date-picker|react-native-calendars|react-native-charts-wrapper|react-native-html-to-pdf|react-native-fs|react-native-print|react-native-credit-card-input|react-native-phone-number-input|react-native-country-picker-modal|react-native-signature-canvas|react-native-signature-pad|react-native-maps|react-native-geolocation-service|react-native-background-job|react-native-background-timer|react-native-flash-message|react-native-gifted-chat|react-native-image-crop-picker|react-native-contacts|react-native-share-menu|react-native-sound|react-native-video|react-native-webview|react-native-pdf|react-native-file-viewer|react-native-download-manager|react-native-share-sheet|react-native-share-extension)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
  },
  testEnvironment: 'jsdom',
  setupFiles: [
    '<rootDir>/jest.setup.js',
  ],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  testTimeout: 10000,
};
