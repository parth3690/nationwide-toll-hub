import { Agency, TollEvent } from '@toll-hub/shared';

/**
 * Elite Connector Interface
 * 
 * Defines the standard interface for all agency connectors:
 * - Authentication methods
 * - Data retrieval operations
 * - Error handling
 * - Health monitoring
 * - Rate limiting
 * 
 * Architecture Decisions:
 * - Adapter pattern for consistent interface
 * - Async operations for scalability
 * - Comprehensive error handling
 * - Health monitoring and metrics
 * - Rate limiting and backoff
 */

export interface ConnectorConfig {
  baseUrl: string;
  authType: 'oauth' | 'credentials' | 'api_key';
  credentials?: {
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    tokenUrl?: string;
  };
  endpoints: {
    accounts: string;
    transactions: string;
    evidence?: string;
    health?: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  timeout?: number;
}

export interface ConnectorHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  details?: any;
}

export interface ConnectorMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date;
  errorCounts: Record<string, number>;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface DataResult<T> {
  success: boolean;
  data?: T[];
  totalCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
  error?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AccountInfo {
  accountId: string;
  accountName: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  lastActivity: Date;
  metadata?: any;
}

export interface TransactionInfo {
  transactionId: string;
  accountId: string;
  timestamp: Date;
  amount: number;
  description: string;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
  vehicleInfo?: {
    plate: string;
    plateState: string;
    vehicleClass?: string;
  };
  metadata?: any;
}

export interface EvidenceInfo {
  evidenceId: string;
  transactionId: string;
  type: 'photo' | 'video' | 'document';
  url: string;
  timestamp: Date;
  metadata?: any;
}

/**
 * Base Connector Interface
 */
export interface IConnector {
  readonly agencyId: string;
  readonly agencyName: string;
  readonly config: ConnectorConfig;

  /**
   * Initialize the connector
   */
  initialize(): Promise<void>;

  /**
   * Authenticate with the agency
   */
  authenticate(credentials?: any): Promise<AuthResult>;

  /**
   * Refresh authentication token
   */
  refreshAuth(): Promise<AuthResult>;

  /**
   * Get account information
   */
  getAccountInfo(accountId: string): Promise<DataResult<AccountInfo>>;

  /**
   * Get transactions for an account
   */
  getTransactions(
    accountId: string,
    options?: PaginationOptions
  ): Promise<DataResult<TransactionInfo>>;

  /**
   * Get evidence for a transaction
   */
  getEvidence(transactionId: string): Promise<DataResult<EvidenceInfo>>;

  /**
   * Get connector health status
   */
  getHealth(): Promise<ConnectorHealth>;

  /**
   * Get connector metrics
   */
  getMetrics(): ConnectorMetrics;

  /**
   * Test connection to agency
   */
  testConnection(): Promise<boolean>;

  /**
   * Close connector and cleanup resources
   */
  close(): Promise<void>;
}

/**
 * Connector Factory Interface
 */
export interface IConnectorFactory {
  /**
   * Create a connector for an agency
   */
  createConnector(agency: Agency): IConnector;

  /**
   * Get supported agencies
   */
  getSupportedAgencies(): string[];

  /**
   * Validate connector configuration
   */
  validateConfig(config: ConnectorConfig): boolean;
}

/**
 * Connector Manager Interface
 */
export interface IConnectorManager {
  /**
   * Register a connector
   */
  registerConnector(connector: IConnector): void;

  /**
   * Get connector by agency ID
   */
  getConnector(agencyId: string): IConnector | null;

  /**
   * Get all connectors
   */
  getAllConnectors(): IConnector[];

  /**
   * Get connector health status
   */
  getConnectorHealth(agencyId: string): Promise<ConnectorHealth>;

  /**
   * Get all connector health statuses
   */
  getAllConnectorHealth(): Promise<Record<string, ConnectorHealth>>;

  /**
   * Test all connectors
   */
  testAllConnectors(): Promise<Record<string, boolean>>;

  /**
   * Close all connectors
   */
  closeAllConnectors(): Promise<void>;
}

/**
 * Connector Event Interface
 */
export interface IConnectorEvents {
  /**
   * Emit connector event
   */
  emit(event: string, data: any): void;

  /**
   * Listen to connector events
   */
  on(event: string, handler: (data: any) => void): void;

  /**
   * Remove event listener
   */
  off(event: string, handler: (data: any) => void): void;
}

/**
 * Connector Error Types
 */
export enum ConnectorErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  TIMEOUT = 'TIMEOUT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ConnectorError extends Error {
  constructor(
    public type: ConnectorErrorType,
    message: string,
    public agencyId: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}
