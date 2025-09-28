/**
 * Elite Type Definitions for Nationwide Toll Hub Mobile App
 * 
 * Comprehensive type definitions for the mobile application,
 * ensuring type safety across all components and services.
 */

import { User, Vehicle, TollEvent, Statement, Agency } from '@nationwide-toll-hub/shared';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Splash: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email: string };
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tolls: undefined;
  Statements: undefined;
  Payments: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  TollDetail: { tollId: string };
  StatementDetails: { statementId: string };
  Payment: { tollId?: string; statementId?: string; amount?: number };
};

// User Types
export interface MobileUser extends User {
  profileImage?: string;
  preferences: UserPreferences;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  defaultPaymentMethod?: string;
  autoPay: boolean;
  lowBalanceAlert: boolean;
  statementFrequency: 'weekly' | 'monthly' | 'quarterly';
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  biometric?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MobileUser | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
  } | null;
  error: string | null;
  biometricEnabled: boolean;
}

// Toll Types
export interface MobileTollEvent extends TollEvent {
  evidenceImages: string[];
  locationImage?: string;
  disputeStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  disputeReason?: string;
  isFavorited: boolean;
  tags: string[];
}

export interface TollFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  agencies: string[];
  vehicleIds: string[];
  amountRange: {
    min: number;
    max: number;
  };
  status: ('paid' | 'pending' | 'disputed' | 'failed')[];
  tags: string[];
}

export interface TollSummary {
  totalAmount: number;
  totalTransactions: number;
  paidAmount: number;
  pendingAmount: number;
  disputedAmount: number;
  averagePerTransaction: number;
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'stable';
}

// Statement Types
export interface MobileStatement extends Statement {
  downloadUrl?: string;
  isDownloaded: boolean;
  shareUrl?: string;
}

export interface StatementFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  agencies: string[];
  format: 'pdf' | 'csv';
  status: ('generated' | 'sent' | 'paid')[];
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'digital_wallet';
  name: string;
  lastFour: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  brand?: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: PaymentMethod;
  tollEventIds: string[];
  statementId?: string;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
  receiptUrl?: string;
}

export interface PaymentFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  status: ('pending' | 'completed' | 'failed' | 'refunded')[];
  methods: string[];
  amountRange: {
    min: number;
    max: number;
  };
}

// Vehicle Types
export interface MobileVehicle extends Vehicle {
  image?: string;
  isActive: boolean;
  lastTollDate?: Date;
  totalTolls: number;
  totalSpent: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'toll' | 'payment' | 'statement' | 'dispute' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isImportant: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  tollAlerts: boolean;
  paymentAlerts: boolean;
  statementAlerts: boolean;
  disputeAlerts: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// Component Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  icon?: string;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface TollChartData {
  daily: ChartData;
  weekly: ChartData;
  monthly: ChartData;
  yearly: ChartData;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface NearbyToll {
  id: string;
  name: string;
  location: LocationData;
  distance: number;
  agency: Agency;
  rates: {
    vehicleClass: string;
    amount: number;
  }[];
}

// Dispute Types
export interface Dispute {
  id: string;
  tollEventId: string;
  reason: string;
  description: string;
  evidence: {
    images: string[];
    documents: string[];
    notes?: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  resolution?: string;
  refundAmount?: number;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  biometricAuth: boolean;
  autoLock: boolean;
  autoLockTimeout: number;
  hapticFeedback: boolean;
  soundEffects: boolean;
  analytics: boolean;
  crashReporting: boolean;
}

// Storage Types
export interface StorageKeys {
  AUTH_TOKEN: string;
  REFRESH_TOKEN: string;
  USER_DATA: string;
  BIOMETRIC_ENABLED: string;
  THEME: string;
  LANGUAGE: string;
  CURRENCY: string;
  NOTIFICATION_SETTINGS: string;
  APP_SETTINGS: string;
  CACHED_TOLLS: string;
  CACHED_STATEMENTS: string;
  CACHED_PAYMENTS: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

// Navigation State Types
export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  params?: any;
  history: string[];
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

// Deep Link Types
export interface DeepLinkData {
  type: 'toll' | 'statement' | 'payment' | 'dispute';
  id: string;
  action?: 'view' | 'pay' | 'dispute';
}

// Export all types
export * from '@nationwide-toll-hub/shared';
