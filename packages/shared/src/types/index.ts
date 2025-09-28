import { z } from 'zod';

// Base Entity Schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User and Authentication Types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  passwordHash: z.string().optional(),
  mfaEnabled: z.boolean().default(false),
  mfaSecret: z.string().optional(),
  lastLoginAt: z.date().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  plate: z.string().min(1).max(20),
  plateState: z.string().length(2),
  vehicleType: z.string().optional(),
  axleCount: z.number().int().positive().optional(),
  class: z.string().optional(),
  nickname: z.string().max(100).optional(),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['card', 'ach']),
  processor: z.string(),
  processorToken: z.string(),
  last4: z.string().length(4),
  brand: z.string().optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Agency Types
export const AgencySchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  states: z.array(z.string().length(2)),
  protocol: z.enum(['ezpass', 'sunpass', 'fastrak', 'txtag', 'mta', 'proprietary']),
  capabilities: z.object({
    read: z.boolean(),
    write: z.boolean(),
    topup: z.boolean(),
    evidence: z.boolean(),
  }),
  connectorConfig: z.record(z.any()),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AgencyAccountLinkSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  agencyId: z.string(),
  externalAccountId: z.string(),
  status: z.enum(['pending', 'active', 'failed', 'revoked']),
  authMethod: z.enum(['oauth', 'credentials']),
  authTokens: z.record(z.any()),
  lastSyncAt: z.date().optional(),
  nextSyncAt: z.date().optional(),
  syncStatus: z.enum(['success', 'failed', 'pending']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Toll Event Types
export const TollEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  agencyId: z.string(),
  externalEventId: z.string(),
  plate: z.string(),
  plateState: z.string().length(2),
  eventTimestamp: z.date(),
  gantryId: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    direction: z.string().optional(),
    roadName: z.string().optional(),
  }).optional(),
  vehicleClass: z.string().optional(),
  rawAmount: z.number().positive(),
  ratedAmount: z.number().positive(),
  fees: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  evidenceUri: z.string().url().optional(),
  source: z.enum(['agency_feed', 'plate_pay', 'manual']),
  status: z.enum(['pending', 'posted', 'disputed', 'voided']).default('pending'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Statement Types
export const StatementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  periodStart: z.date(),
  periodEnd: z.date(),
  timezone: z.string(),
  subtotal: z.number().nonnegative(),
  fees: z.number().nonnegative(),
  credits: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  status: z.enum(['draft', 'open', 'closed', 'paid', 'overdue']).default('draft'),
  paymentMethodId: z.string().uuid().optional(),
  paymentTransactionId: z.string().optional(),
  paidAt: z.date().optional(),
  breakdown: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StatementItemSchema = z.object({
  id: z.string().uuid(),
  statementId: z.string().uuid(),
  tollEventId: z.string().uuid(),
  amount: z.number().positive(),
  createdAt: z.date(),
});

// Dispute Types
export const DisputeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tollEventId: z.string().uuid(),
  type: z.enum(['wrong_plate', 'wrong_class', 'duplicate', 'other']),
  status: z.enum(['submitted', 'in_review', 'resolved', 'rejected']).default('submitted'),
  description: z.string(),
  evidenceUrls: z.array(z.string().url()).default([]),
  agencyReference: z.string().optional(),
  resolution: z.string().optional(),
  submittedAt: z.date(),
  resolvedAt: z.date().optional(),
  slaDeadline: z.date().optional(),
});

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.any()).optional(),
    requestId: z.string().optional(),
    timestamp: z.date(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    hasMore: z.boolean().optional(),
  }).optional(),
});

// JWT Token Types
export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(z.string()),
  agencies: z.array(z.string()).optional(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string().uuid(),
});

// Event Types for Kafka
export const TollEventRawSchema = z.object({
  eventId: z.string(),
  agencyId: z.string(),
  rawData: z.record(z.any()),
  receivedAt: z.date(),
  source: z.string(),
});

export const TollEventNormalizedSchema = z.object({
  eventId: z.string(),
  agencyId: z.string(),
  normalizedData: z.record(z.any()),
  processedAt: z.date(),
  version: z.string(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Agency = z.infer<typeof AgencySchema>;
export type AgencyAccountLink = z.infer<typeof AgencyAccountLinkSchema>;
export type TollEvent = z.infer<typeof TollEventSchema>;
export type Statement = z.infer<typeof StatementSchema>;
export type StatementItem = z.infer<typeof StatementItemSchema>;
export type Dispute = z.infer<typeof DisputeSchema>;
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type TollEventRaw = z.infer<typeof TollEventRawSchema>;
export type TollEventNormalized = z.infer<typeof TollEventNormalizedSchema>;
