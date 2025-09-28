// Jest setup file for global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/toll_hub_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
process.env.API_KEY = 'test-api-key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Generate random test data
  generateRandomEmail: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  generateRandomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  generateRandomId: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  
  // Wait utility
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock date
  mockDate: (date) => {
    const originalDate = Date;
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(date);
        } else {
          super(...args);
        }
      }
    };
    global.Date.now = () => date.getTime();
    return () => {
      global.Date = originalDate;
    };
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
