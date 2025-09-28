import { BaseConnector } from '../base/BaseConnector';
import { ConnectorConfig, ConnectorError, ConnectorErrorType } from '../interfaces/IConnector';
import axios from 'axios';

/**
 * Elite Base Connector Tests
 * 
 * Comprehensive test suite for the base connector functionality.
 * Tests authentication, data transformation, error handling, and metrics.
 */

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the abstract methods by creating a concrete implementation
class TestConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super('test-agency', 'Test Agency', config);
  }

  protected transformAccountInfo(data: any): any {
    return {
      id: data.accountId,
      name: data.accountName,
      balance: data.currentBalance,
    };
  }

  protected transformTransaction(data: any): any {
    return {
      id: data.transactionId,
      amount: data.amount,
      timestamp: new Date(data.timestamp),
    };
  }

  protected transformEvidence(data: any): any {
    return {
      id: data.evidenceId,
      url: data.url,
      type: data.type,
    };
  }
}

describe('BaseConnector', () => {
  let connector: TestConnector;
  let mockConfig: ConnectorConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://api.test-agency.com',
      authType: 'oauth',
      credentials: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        tokenUrl: 'https://api.test-agency.com/auth/token',
      },
      endpoints: {
        accounts: '/accounts',
        transactions: '/transactions',
        evidence: '/evidence',
        health: '/health',
      },
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
      },
    };

    connector = new TestConnector(mockConfig);
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      // Arrange
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn().mockResolvedValue({ status: 200 }),
        post: jest.fn().mockResolvedValue({
          data: {
            access_token: 'test-token',
            expires_in: 3600,
          },
        }),
      } as any);

      // Act
      await connector.initialize();

      // Assert
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockConfig.baseUrl,
        timeout: mockConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TollHub-Connector/1.0.0',
        },
      });
    });

    it('should throw error for invalid configuration', async () => {
      // Arrange
      const invalidConfig = {
        ...mockConfig,
        baseUrl: '', // Invalid base URL
      };

      const invalidConnector = new TestConnector(invalidConfig);

      // Act & Assert
      await expect(invalidConnector.initialize()).rejects.toThrow(ConnectorError);
    });

    it('should throw error for missing endpoints', async () => {
      // Arrange
      const invalidConfig = {
        ...mockConfig,
        endpoints: {
          accounts: '/accounts',
          // Missing transactions endpoint
        },
      };

      const invalidConnector = new TestConnector(invalidConfig);

      // Act & Assert
      await expect(invalidConnector.initialize()).rejects.toThrow(ConnectorError);
    });
  });

  describe('authentication', () => {
    it('should authenticate successfully with OAuth', async () => {
      // Arrange
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockResolvedValue({
          data: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Act
      const result = await connector.authenticate();

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-access-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockHttpClient.post).toHaveBeenCalledWith(mockConfig.credentials!.tokenUrl, {
        grant_type: 'client_credentials',
        client_id: mockConfig.credentials!.clientId,
        client_secret: mockConfig.credentials!.clientSecret,
      });
    });

    it('should authenticate successfully with API key', async () => {
      // Arrange
      const apiKeyConfig = {
        ...mockConfig,
        authType: 'api_key' as const,
        credentials: {
          apiKey: 'test-api-key',
        },
      };

      const apiKeyConnector = new TestConnector(apiKeyConfig);
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Act
      const result = await apiKeyConnector.authenticate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should authenticate successfully with credentials', async () => {
      // Arrange
      const credsConfig = {
        ...mockConfig,
        authType: 'credentials' as const,
        credentials: {
          username: 'test-user',
          password: 'test-password',
        },
      };

      const credsConnector = new TestConnector(credsConfig);
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockResolvedValue({
          data: {
            token: 'test-token',
            expires_in: 3600,
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Act
      const result = await credsConnector.authenticate();

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-token');
      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', {
        username: 'test-user',
        password: 'test-password',
      });
    });

    it('should handle authentication failure', async () => {
      // Arrange
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockRejectedValue(new Error('Authentication failed')),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Act
      const result = await connector.authenticate();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('should refresh token successfully', async () => {
      // Arrange
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockResolvedValue({
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        }),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Set up connector with refresh token
      connector['refreshToken'] = 'test-refresh-token';

      // Act
      const result = await connector.refreshAuth();

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'test-refresh-token',
      });
    });

    it('should handle refresh token failure', async () => {
      // Arrange
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: jest.fn().mockRejectedValue(new Error('Refresh failed')),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      connector['refreshToken'] = 'invalid-refresh-token';

      // Act
      const result = await connector.refreshAuth();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh failed');
    });
  });

  describe('data retrieval', () => {
    beforeEach(() => {
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        request: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);
      connector['httpClient'] = mockHttpClient as any;
    });

    it('should get account info successfully', async () => {
      // Arrange
      const mockAccountData = {
        accountId: 'acc-123',
        accountName: 'Test Account',
        currentBalance: 100.50,
      };

      connector['httpClient'].request = jest.fn().mockResolvedValue({
        data: mockAccountData,
      });

      // Act
      const result = await connector.getAccountInfo('acc-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'acc-123',
        name: 'Test Account',
        balance: 100.50,
      });
      expect(connector['httpClient'].request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/accounts/acc-123',
      });
    });

    it('should get transactions successfully', async () => {
      // Arrange
      const mockTransactionData = [
        {
          transactionId: 'txn-1',
          amount: 2.50,
          timestamp: '2023-12-01T10:00:00Z',
        },
        {
          transactionId: 'txn-2',
          amount: 3.75,
          timestamp: '2023-12-01T11:00:00Z',
        },
      ];

      connector['httpClient'].request = jest.fn().mockResolvedValue({
        data: mockTransactionData,
        headers: {
          'x-total-count': '2',
          'x-has-more': 'false',
        },
      });

      // Act
      const result = await connector.getTransactions('acc-123', { page: 1, limit: 10 });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.totalCount).toBe('2');
      expect(result.hasMore).toBe(false);
      expect(result.data[0]).toEqual({
        id: 'txn-1',
        amount: 2.50,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      });
    });

    it('should get evidence successfully', async () => {
      // Arrange
      const mockEvidenceData = [
        {
          evidenceId: 'ev-1',
          url: 'https://example.com/evidence1.jpg',
          type: 'image',
        },
      ];

      connector['httpClient'].request = jest.fn().mockResolvedValue({
        data: mockEvidenceData,
      });

      // Act
      const result = await connector.getEvidence('txn-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'ev-1',
        url: 'https://example.com/evidence1.jpg',
        type: 'image',
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      connector['httpClient'].request = jest.fn().mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Account not found' },
        },
      });

      // Act
      const result = await connector.getAccountInfo('nonexistent-account');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account not found');
    });
  });

  describe('health monitoring', () => {
    beforeEach(() => {
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);
      connector['httpClient'] = mockHttpClient as any;
    });

    it('should return healthy status', async () => {
      // Arrange
      connector['httpClient'].get = jest.fn().mockResolvedValue({ status: 200 });
      connector['isHealthy'] = true;
      connector['metrics'] = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        averageResponseTime: 250,
        lastRequestTime: new Date(),
        errorCounts: {},
      };

      // Act
      const health = await connector.getHealth();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.errorRate).toBe(0.05);
      expect(health.details).toEqual({
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        averageResponseTime: 250,
      });
    });

    it('should return degraded status for high error rate', async () => {
      // Arrange
      connector['isHealthy'] = true;
      connector['metrics'] = {
        totalRequests: 100,
        successfulRequests: 70,
        failedRequests: 30,
        averageResponseTime: 500,
        lastRequestTime: new Date(),
        errorCounts: {},
      };

      // Act
      const health = await connector.getHealth();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.errorRate).toBe(0.3);
    });

    it('should return unhealthy status for critical error rate', async () => {
      // Arrange
      connector['isHealthy'] = false;
      connector['metrics'] = {
        totalRequests: 100,
        successfulRequests: 40,
        failedRequests: 60,
        averageResponseTime: 1000,
        lastRequestTime: new Date(),
        errorCounts: {},
      };

      // Act
      const health = await connector.getHealth();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(health.errorRate).toBe(0.6);
    });

    it('should handle health check timeout', async () => {
      // Arrange
      connector['httpClient'].get = jest.fn().mockRejectedValue(new Error('timeout'));

      // Act
      const health = await connector.getHealth();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(health.responseTime).toBe(0);
    });
  });

  describe('metrics', () => {
    it('should return current metrics', () => {
      // Arrange
      const expectedMetrics = {
        totalRequests: 150,
        successfulRequests: 140,
        failedRequests: 10,
        averageResponseTime: 300,
        lastRequestTime: new Date(),
        errorCounts: {
          [ConnectorErrorType.NETWORK_ERROR]: 5,
          [ConnectorErrorType.TIMEOUT]: 3,
        },
      };

      connector['metrics'] = expectedMetrics;

      // Act
      const metrics = connector.getMetrics();

      // Assert
      expect(metrics).toEqual(expectedMetrics);
    });
  });

  describe('connection testing', () => {
    beforeEach(() => {
      const mockHttpClient = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);
      connector['httpClient'] = mockHttpClient as any;
    });

    it('should test connection successfully', async () => {
      // Arrange
      connector['httpClient'].get = jest.fn().mockResolvedValue({ status: 200 });

      // Act
      const isConnected = await connector.testConnection();

      // Assert
      expect(isConnected).toBe(true);
      expect(connector['httpClient'].get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should handle connection failure', async () => {
      // Arrange
      connector['httpClient'].get = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Act
      const isConnected = await connector.testConnection();

      // Assert
      expect(isConnected).toBe(false);
    });

    it('should fallback to root endpoint if health endpoint fails', async () => {
      // Arrange
      connector['httpClient'].get = jest.fn()
        .mockRejectedValueOnce(new Error('Health endpoint not found'))
        .mockResolvedValueOnce({ status: 200 });

      // Act
      const isConnected = await connector.testConnection();

      // Assert
      expect(isConnected).toBe(true);
      expect(connector['httpClient'].get).toHaveBeenCalledTimes(2);
      expect(connector['httpClient'].get).toHaveBeenNthCalledWith(1, '/health', { timeout: 5000 });
      expect(connector['httpClient'].get).toHaveBeenNthCalledWith(2, '/', { timeout: 5000 });
    });
  });

  describe('cleanup', () => {
    it('should close connector and cleanup resources', async () => {
      // Arrange
      connector['authToken'] = 'test-token';
      connector['refreshToken'] = 'test-refresh-token';
      connector['tokenExpiresAt'] = new Date();
      connector['isHealthy'] = true;

      // Act
      await connector.close();

      // Assert
      expect(connector['authToken']).toBeNull();
      expect(connector['refreshToken']).toBeNull();
      expect(connector['tokenExpiresAt']).toBeNull();
      expect(connector['isHealthy']).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should categorize network errors correctly', () => {
      // Arrange
      const networkError = new Error('Connection refused');
      (networkError as any).code = 'ECONNREFUSED';

      // Act
      const errorType = connector['getErrorType'](networkError);

      // Assert
      expect(errorType).toBe(ConnectorErrorType.NETWORK_ERROR);
    });

    it('should categorize timeout errors correctly', () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ECONNABORTED';

      // Act
      const errorType = connector['getErrorType'](timeoutError);

      // Assert
      expect(errorType).toBe(ConnectorErrorType.TIMEOUT);
    });

    it('should categorize authentication errors correctly', () => {
      // Arrange
      const authError = {
        response: { status: 401 },
      };

      // Act
      const errorType = connector['getErrorType'](authError);

      // Assert
      expect(errorType).toBe(ConnectorErrorType.AUTHENTICATION_FAILED);
    });

    it('should categorize rate limit errors correctly', () => {
      // Arrange
      const rateLimitError = {
        response: { status: 429 },
      };

      // Act
      const errorType = connector['getErrorType'](rateLimitError);

      // Assert
      expect(errorType).toBe(ConnectorErrorType.RATE_LIMIT_EXCEEDED);
    });

    it('should categorize client errors correctly', () => {
      // Arrange
      const clientError = {
        response: { status: 400 },
      };

      // Act
      const errorType = connector['getErrorType'](clientError);

      // Assert
      expect(errorType).toBe(ConnectorErrorType.INVALID_RESPONSE);
    });
  });
});
