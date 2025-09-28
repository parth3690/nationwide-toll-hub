/**
 * Application-wide constants for the Toll Hub platform
 * Centralized configuration for consistency across services
 */

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  MAX_REQUEST_SIZE: '10mb',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
} as const;

// Database Configuration
export const DB_CONFIG = {
  POOL_MIN: 2,
  POOL_MAX: 20,
  CONNECTION_TIMEOUT: 10000,
  IDLE_TIMEOUT: 30000,
  QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 60000,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  TTL: {
    SESSION: 24 * 60 * 60, // 24 hours
    USER_PROFILE: 60 * 60, // 1 hour
    VEHICLES: 60 * 60, // 1 hour
    AGENCY_CAPABILITIES: 24 * 60 * 60, // 24 hours
    RATE_LIMIT: 60, // 1 minute
    STATEMENT_DRAFT: 48 * 60 * 60, // 48 hours
    CONNECTOR_HEALTH: 5 * 60, // 5 minutes
  },
  PREFIXES: {
    SESSION: 'session:',
    USER: 'user:',
    VEHICLE: 'vehicle:',
    AGENCY: 'agency:',
    RATE_LIMIT: 'rate_limit:',
    STATEMENT: 'statement:',
    CONNECTOR: 'connector:',
  },
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '7d',
  ISSUER: 'toll-hub',
  AUDIENCE: 'toll-hub-users',
} as const;

// Encryption Configuration
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  SALT_LENGTH: 32,
  ITERATIONS: 100000,
} as const;

// Agency Protocols
export const AGENCY_PROTOCOLS = {
  EZPASS: 'ezpass',
  SUNPASS: 'sunpass',
  FASTRAK: 'fastrak',
  TXTAG: 'txtag',
  MTA: 'mta',
  PROPRIETARY: 'proprietary',
} as const;

// Vehicle Classes
export const VEHICLE_CLASSES = {
  CLASS_1: 'class_1', // Motorcycles
  CLASS_2: 'class_2', // Cars, SUVs, Pickups
  CLASS_3: 'class_3', // 2-axle trucks
  CLASS_4: 'class_4', // 3-axle trucks
  CLASS_5: 'class_5', // 4-axle trucks
  CLASS_6: 'class_6', // 5-axle trucks
  CLASS_7: 'class_7', // 6+ axle trucks
} as const;

// Event Status
export const EVENT_STATUS = {
  PENDING: 'pending',
  POSTED: 'posted',
  DISPUTED: 'disputed',
  VOIDED: 'voided',
} as const;

// Statement Status
export const STATEMENT_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

// Dispute Status
export const DISPUTE_STATUS = {
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;

// Dispute Types
export const DISPUTE_TYPES = {
  WRONG_PLATE: 'wrong_plate',
  WRONG_CLASS: 'wrong_class',
  DUPLICATE: 'duplicate',
  OTHER: 'other',
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

// Agency Account Link Status
export const LINK_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  FAILED: 'failed',
  REVOKED: 'revoked',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  ACH: 'ach',
} as const;

// Payment Processors
export const PAYMENT_PROCESSORS = {
  STRIPE: 'stripe',
  PLAID: 'plaid',
} as const;

// Kafka Topics
export const KAFKA_TOPICS = {
  TOLL_EVENTS_RAW: 'toll.events.raw',
  TOLL_EVENTS_NORMALIZED: 'toll.events.normalized',
  TOLL_EVENTS_MATCHED: 'toll.events.matched',
  STATEMENTS_GENERATE: 'statements.generate',
  STATEMENTS_CLOSED: 'statements.closed',
  DISPUTES_SUBMITTED: 'disputes.submitted',
  DISPUTES_UPDATES: 'disputes.updates',
  PAYMENTS_INITIATED: 'payments.initiated',
  PAYMENTS_COMPLETED: 'payments.completed',
  CONNECTOR_HEALTH: 'connector.health',
} as const;

// Event Sources
export const EVENT_SOURCES = {
  AGENCY_FEED: 'agency_feed',
  PLATE_PAY: 'plate_pay',
  MANUAL: 'manual',
} as const;

// File Storage Paths
export const STORAGE_PATHS = {
  EVIDENCE: 'toll-evidence',
  STATEMENTS: 'statements',
  DISPUTES: 'disputes',
  AUDIT_LOGS: 'audit-logs',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
} as const;

// Notification Templates
export const NOTIFICATION_TEMPLATES = {
  WELCOME: 'welcome',
  STATEMENT_READY: 'statement_ready',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  DISPUTE_SUBMITTED: 'dispute_submitted',
  DISPUTE_RESOLVED: 'dispute_resolved',
  MFA_CODE: 'mfa_code',
  PASSWORD_RESET: 'password_reset',
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  AUTH: {
    LOGIN: { window: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    SIGNUP: { window: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
    PASSWORD_RESET: { window: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  },
  API: {
    GENERAL: { window: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    HEAVY: { window: 60 * 60 * 1000, max: 1000 }, // 1000 requests per hour
  },
  CONNECTOR: {
    SYNC: { window: 60 * 1000, max: 10 }, // 10 syncs per minute
    HEALTH_CHECK: { window: 60 * 1000, max: 60 }, // 60 checks per minute
  },
} as const;

// Business Rules
export const BUSINESS_RULES = {
  STATEMENT_GENERATION_HOUR: 0, // Midnight local time
  STATEMENT_GRACE_PERIOD_DAYS: 7,
  DISPUTE_SLA_DAYS: 14,
  PAYMENT_RETRY_ATTEMPTS: 3,
  PAYMENT_RETRY_DELAY_MS: 5 * 60 * 1000, // 5 minutes
  MAX_VEHICLES_PER_USER: 10,
  MAX_PAYMENT_METHODS_PER_USER: 5,
  MAX_AGENCY_LINKS_PER_USER: 20,
} as const;

// Monitoring Thresholds
export const MONITORING_THRESHOLDS = {
  ERROR_RATE_P0: 0.01, // 1%
  ERROR_RATE_P1: 0.05, // 5%
  RESPONSE_TIME_P95_P0: 500, // 500ms
  RESPONSE_TIME_P95_P1: 2000, // 2s
  CONNECTOR_FAILURE_THRESHOLD: 3,
  RECONCILIATION_VARIANCE_THRESHOLD: 0.005, // 0.5%
  DISK_USAGE_WARNING: 0.8, // 80%
  DISK_USAGE_CRITICAL: 0.9, // 90%
  CACHE_MISS_RATE_WARNING: 0.5, // 50%
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  MFA_BACKUP_CODES_COUNT: 10,
  LOGIN_ATTEMPT_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  MFA_ENABLED: 'mfa_enabled',
  DISPUTE_MANAGEMENT: 'dispute_management',
  FLEET_MANAGEMENT: 'fleet_management',
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  PARTNER_API: 'partner_api',
  ADVANCED_FILTERING: 'advanced_filtering',
} as const;

// Time Zones
export const TIMEZONES = {
  EST: 'America/New_York',
  CST: 'America/Chicago',
  MST: 'America/Denver',
  PST: 'America/Los_Angeles',
  UTC: 'UTC',
} as const;

// Currency Codes
export const CURRENCIES = {
  USD: 'USD',
  CAD: 'CAD',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
