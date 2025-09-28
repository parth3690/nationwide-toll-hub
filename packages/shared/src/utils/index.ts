import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isValid } from 'date-fns';
import { z } from 'zod';

/**
 * Utility functions for the Toll Hub platform
 * Provides common operations used across all services
 */

// UUID Generation
export const generateId = (): string => uuidv4();

// Date Utilities
export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  return format(dateObj, formatStr);
};

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date);
};

// Validation Utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePlate = (plate: string, state: string): boolean => {
  // Basic plate validation - in production, this would be state-specific
  const plateRegex = /^[A-Z0-9\s-]{1,8}$/;
  return plateRegex.test(plate.toUpperCase());
};

export const validateStateCode = (state: string): boolean => {
  const stateCodes = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];
  return stateCodes.includes(state.toUpperCase());
};

// Encryption Utilities
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
};

// Currency Utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const parseCurrency = (amount: string): number => {
  return parseFloat(amount.replace(/[^0-9.-]/g, ''));
};

// Pagination Utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export const createPaginationMeta = (
  data: any[],
  page: number,
  limit: number,
  total: number,
  nextCursor?: string
) => ({
  page,
  limit,
  total,
  hasMore: data.length === limit && (page * limit) < total,
  nextCursor,
});

// Error Handling Utilities
export class TollHubError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'TollHubError';
  }
}

export const createError = (
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): TollHubError => {
  return new TollHubError(code, message, statusCode, details);
};

// Common Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AGENCY_UNAVAILABLE: 'AGENCY_UNAVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  DUPLICATE_EVENT: 'DUPLICATE_EVENT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MFA_REQUIRED: 'MFA_REQUIRED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
} as const;

// Rate Limiting Utilities
export const createRateLimitKey = (userId: string, endpoint: string): string => {
  return `rate_limit:${userId}:${endpoint}`;
};

export const createSessionKey = (userId: string): string => {
  return `session:${userId}`;
};

export const createUserCacheKey = (userId: string): string => {
  return `user:${userId}`;
};

export const createVehicleCacheKey = (userId: string): string => {
  return `vehicle:${userId}`;
};

// Event Processing Utilities
export const createEventId = (agencyId: string, externalEventId: string): string => {
  return `${agencyId}:${externalEventId}`;
};

export const parseEventId = (eventId: string): { agencyId: string; externalEventId: string } => {
  const [agencyId, ...rest] = eventId.split(':');
  return {
    agencyId,
    externalEventId: rest.join(':'),
  };
};

// Agency Utilities
export const getAgencyCapabilities = (agency: any) => {
  return {
    canRead: agency.capabilities?.read || false,
    canWrite: agency.capabilities?.write || false,
    canTopup: agency.capabilities?.topup || false,
    canEvidence: agency.capabilities?.evidence || false,
  };
};

// Statement Utilities
export const calculateStatementTotal = (items: Array<{ amount: number }>): number => {
  return items.reduce((total, item) => total + item.amount, 0);
};

export const generateStatementId = (userId: string, periodStart: Date): string => {
  const periodStr = formatDate(periodStart, 'yyyy-MM');
  return `stmt_${userId.slice(0, 8)}_${periodStr}`;
};

// Validation Schemas
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Type Guards
export const isTollHubError = (error: any): error is TollHubError => {
  return error instanceof TollHubError;
};

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Performance Utilities
export const measureAsync = async <T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  return { result, duration };
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};
