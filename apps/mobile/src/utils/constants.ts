/**
 * Elite Constants for Nationwide Toll Hub Mobile App
 * 
 * Centralized constants for the mobile application,
 * including API endpoints, configuration, and default values.
 */

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.tollhub.com/api';

export const API_TIMEOUT = 30000; // 30 seconds

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  THEME: 'theme',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  NOTIFICATION_SETTINGS: 'notification_settings',
  APP_SETTINGS: 'app_settings',
  CACHED_TOLLS: 'cached_tolls',
  CACHED_STATEMENTS: 'cached_statements',
  CACHED_PAYMENTS: 'cached_payments',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_LAUNCH: 'first_launch',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Nationwide Toll Hub',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SUPPORT_EMAIL: 'support@tollhub.com',
  SUPPORT_PHONE: '+1-800-TOLL-HUB',
  WEBSITE: 'https://tollhub.com',
  PRIVACY_POLICY: 'https://tollhub.com/privacy',
  TERMS_OF_SERVICE: 'https://tollhub.com/terms',
} as const;

// Theme Configuration
export const THEME = {
  COLORS: {
    // Primary Colors
    PRIMARY: '#1E3A8A',
    PRIMARY_DARK: '#1E40AF',
    PRIMARY_LIGHT: '#3B82F6',
    
    // Secondary Colors
    SECONDARY: '#059669',
    SECONDARY_DARK: '#047857',
    SECONDARY_LIGHT: '#10B981',
    
    // Accent Colors
    ACCENT: '#DC2626',
    ACCENT_DARK: '#B91C1C',
    ACCENT_LIGHT: '#EF4444',
    
    // Neutral Colors
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_50: '#F9FAFB',
    GRAY_100: '#F3F4F6',
    GRAY_200: '#E5E7EB',
    GRAY_300: '#D1D5DB',
    GRAY_400: '#9CA3AF',
    GRAY_500: '#6B7280',
    GRAY_600: '#4B5563',
    GRAY_700: '#374151',
    GRAY_800: '#1F2937',
    GRAY_900: '#111827',
    
    // Status Colors
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
    
    // Background Colors
    BACKGROUND: '#FFFFFF',
    BACKGROUND_SECONDARY: '#F9FAFB',
    BACKGROUND_TERTIARY: '#F3F4F6',
    
    // Text Colors
    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#6B7280',
    TEXT_TERTIARY: '#9CA3AF',
    TEXT_INVERSE: '#FFFFFF',
    
    // Border Colors
    BORDER: '#E5E7EB',
    BORDER_LIGHT: '#F3F4F6',
    BORDER_DARK: '#D1D5DB',
  },
  
  FONTS: {
    REGULAR: 'System',
    MEDIUM: 'System-Medium',
    BOLD: 'System-Bold',
    LIGHT: 'System-Light',
  },
  
  SIZES: {
    // Font Sizes
    FONT_XS: 12,
    FONT_SM: 14,
    FONT_MD: 16,
    FONT_LG: 18,
    FONT_XL: 20,
    FONT_2XL: 24,
    FONT_3XL: 30,
    FONT_4XL: 36,
    
    // Spacing
    SPACE_XS: 4,
    SPACE_SM: 8,
    SPACE_MD: 16,
    SPACE_LG: 24,
    SPACE_XL: 32,
    SPACE_2XL: 48,
    SPACE_3XL: 64,
    
    // Border Radius
    RADIUS_SM: 4,
    RADIUS_MD: 8,
    RADIUS_LG: 12,
    RADIUS_XL: 16,
    RADIUS_2XL: 24,
    RADIUS_FULL: 9999,
    
    // Icon Sizes
    ICON_SM: 16,
    ICON_MD: 24,
    ICON_LG: 32,
    ICON_XL: 48,
    
    // Button Heights
    BUTTON_SM: 32,
    BUTTON_MD: 44,
    BUTTON_LG: 52,
    
    // Input Heights
    INPUT_SM: 40,
    INPUT_MD: 48,
    INPUT_LG: 56,
  },
  
  SHADOWS: {
    SMALL: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    MEDIUM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    LARGE: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;

// Animation Configuration
export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// Pagination Configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  LOAD_MORE_THRESHOLD: 5,
} as const;

// Cache Configuration
export const CACHE = {
  TOLLS_TTL: 5 * 60 * 1000, // 5 minutes
  STATEMENTS_TTL: 30 * 60 * 1000, // 30 minutes
  PAYMENTS_TTL: 10 * 60 * 1000, // 10 minutes
  USER_DATA_TTL: 60 * 60 * 1000, // 1 hour
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]+$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  LICENSE_PLATE: {
    PATTERN: /^[A-Z0-9\s\-]+$/,
    MIN_LENGTH: 2,
    MAX_LENGTH: 10,
  },
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy h:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
  SHORT: 'MM/dd/yy',
  LONG: 'EEEE, MMMM dd, yyyy',
  TIME_ONLY: 'h:mm a',
  DATE_ONLY: 'MMM dd',
} as const;

// Currency Configuration
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOLS: {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
  },
  DECIMAL_PLACES: 2,
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  TOLL: 'toll',
  PAYMENT: 'payment',
  STATEMENT: 'statement',
  DISPUTE: 'dispute',
  SYSTEM: 'system',
} as const;

// Toll Status
export const TOLL_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  DISPUTED: 'disputed',
  FAILED: 'failed',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Dispute Status
export const DISPUTE_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 'car',
  TRUCK: 'truck',
  MOTORCYCLE: 'motorcycle',
  BUS: 'bus',
  RV: 'rv',
} as const;

// Agency Types
export const AGENCY_TYPES = {
  STATE: 'state',
  REGIONAL: 'regional',
  PRIVATE: 'private',
} as const;

// File Types
export const FILE_TYPES = {
  IMAGE: 'image',
  PDF: 'pdf',
  CSV: 'csv',
  DOCUMENT: 'document',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  DISPUTE_SUBMITTED: 'Dispute submitted successfully',
  STATEMENT_GENERATED: 'Statement generated successfully',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  REGISTER_FAILED: 'Registration failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  BIOMETRIC_ERROR: 'Biometric authentication failed.',
  CAMERA_ERROR: 'Camera access denied.',
  LOCATION_ERROR: 'Location access denied.',
} as const;

// Deep Link Schemes
export const DEEP_LINKS = {
  SCHEME: 'tollhub',
  HOST: 'tollhub.com',
  PATHS: {
    TOLL: '/toll',
    STATEMENT: '/statement',
    PAYMENT: '/payment',
    DISPUTE: '/dispute',
  },
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  // Authentication
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  REGISTER: 'user_register',
  
  // Navigation
  SCREEN_VIEW: 'screen_view',
  TAB_SELECT: 'tab_select',
  
  // Toll Management
  TOLL_VIEW: 'toll_view',
  TOLL_DISPUTE: 'toll_dispute',
  TOLL_FAVORITE: 'toll_favorite',
  
  // Payments
  PAYMENT_INITIATE: 'payment_initiate',
  PAYMENT_COMPLETE: 'payment_complete',
  PAYMENT_FAIL: 'payment_fail',
  
  // Statements
  STATEMENT_VIEW: 'statement_view',
  STATEMENT_DOWNLOAD: 'statement_download',
  STATEMENT_SHARE: 'statement_share',
  
  // Profile
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  DARK_THEME: true,
  MULTI_LANGUAGE: true,
  VOICE_NOTES: false,
  AR_CAMERA: false,
} as const;

export default {
  API_BASE_URL,
  API_TIMEOUT,
  STORAGE_KEYS,
  APP_CONFIG,
  THEME,
  ANIMATIONS,
  PAGINATION,
  CACHE,
  VALIDATION,
  DATE_FORMATS,
  CURRENCY,
  NOTIFICATION_TYPES,
  TOLL_STATUS,
  PAYMENT_STATUS,
  DISPUTE_STATUS,
  VEHICLE_TYPES,
  AGENCY_TYPES,
  FILE_TYPES,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  DEEP_LINKS,
  ANALYTICS_EVENTS,
  FEATURE_FLAGS,
};
