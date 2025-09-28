import { performance } from 'perf_hooks';
import axios from 'axios';

/**
 * Elite Load Tests
 * 
 * Comprehensive load testing suite for the Nationwide Toll Hub system.
 * Tests system performance under various load conditions and stress scenarios.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
}

interface TestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

class LoadTester {
  private results: Array<{
    requestId: string;
    startTime: number;
    endTime: number;
    status: 'success' | 'error';
    responseTime: number;
    error?: string;
  }> = [];

  async runLoadTest(config: LoadTestConfig): Promise<TestResult> {
    console.log(`🚀 Starting load test with ${config.concurrentUsers} concurrent users`);
    console.log(`📊 Configuration:`, config);

    const startTime = performance.now();
    const promises: Promise<void>[] = [];

    // Create concurrent user sessions
    for (let i = 0; i < config.concurrentUsers; i++) {
      const userDelay = (config.rampUpTime * 1000 * i) / config.concurrentUsers;
      promises.push(this.simulateUser(i, config, userDelay));
    }

    // Wait for all users to complete
    await Promise.all(promises);

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000; // seconds

    return this.calculateResults(totalDuration);
  }

  private async simulateUser(
    userId: number,
    config: LoadTestConfig,
    initialDelay: number
  ): Promise<void> {
    // Wait for ramp-up
    if (initialDelay > 0) {
      await this.sleep(initialDelay);
    }

    const userStartTime = performance.now();
    const userPromises: Promise<void>[] = [];

    // Generate requests for this user
    for (let i = 0; i < config.requestsPerUser; i++) {
      const requestDelay = (config.testDuration * 1000 * i) / config.requestsPerUser;
      userPromises.push(this.makeRequest(userId, i, requestDelay));
    }

    await Promise.all(userPromises);
  }

  private async makeRequest(userId: number, requestId: number, delay: number): Promise<void> {
    if (delay > 0) {
      await this.sleep(delay);
    }

    const requestStartTime = performance.now();
    const fullRequestId = `user-${userId}-req-${requestId}`;

    try {
      // Simulate different types of requests
      const requestType = requestId % 4;
      let response;

      switch (requestType) {
        case 0:
          // Authentication request
          response = await axios.post(`${API_BASE}/auth/login`, {
            email: `loadtest${userId}@example.com`,
            password: 'LoadTest123!',
          }, { timeout: 30000 });
          break;

        case 1:
          // Get user profile
          response = await axios.get(`${API_BASE}/user/profile`, {
            headers: { Authorization: 'Bearer mock-token' },
            timeout: 30000,
          });
          break;

        case 2:
          // Get toll events
          response = await axios.get(`${API_BASE}/toll/events`, {
            headers: { Authorization: 'Bearer mock-token' },
            params: { limit: 10, offset: 0 },
            timeout: 30000,
          });
          break;

        case 3:
          // Get statements
          response = await axios.get(`${API_BASE}/statements`, {
            headers: { Authorization: 'Bearer mock-token' },
            params: { year: 2023, month: 12 },
            timeout: 30000,
          });
          break;

        default:
          response = await axios.get(`${API_BASE}/health`, { timeout: 30000 });
      }

      const requestEndTime = performance.now();
      const responseTime = requestEndTime - requestStartTime;

      this.results.push({
        requestId: fullRequestId,
        startTime: requestStartTime,
        endTime: requestEndTime,
        status: 'success',
        responseTime,
      });

    } catch (error) {
      const requestEndTime = performance.now();
      const responseTime = requestEndTime - requestStartTime;

      this.results.push({
        requestId: fullRequestId,
        startTime: requestStartTime,
        endTime: requestEndTime,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private calculateResults(totalDuration: number): TestResult {
    const successfulRequests = this.results.filter(r => r.status === 'success').length;
    const failedRequests = this.results.filter(r => r.status === 'error').length;
    const totalRequests = this.results.length;

    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const requestsPerSecond = totalRequests / totalDuration;
    const errorRate = (failedRequests / totalRequests) * 100;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      minResponseTime: Math.round(minResponseTime * 100) / 100,
      maxResponseTime: Math.round(maxResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

describe('Load Tests', () => {
  let loadTester: LoadTester;

  beforeAll(() => {
    loadTester = new LoadTester();
  });

  describe('Light Load Test', () => {
    it('should handle light load (10 users, 5 requests each)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 10,
        requestsPerUser: 5,
        rampUpTime: 5,
        testDuration: 30,
      };

      const result = await loadTester.runLoadTest(config);

      console.log('📈 Light Load Test Results:', result);

      // Assertions for light load
      expect(result.errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(result.averageResponseTime).toBeLessThan(1000); // Less than 1 second
      expect(result.p95ResponseTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(1);
    }, 60000); // 60 second timeout
  });

  describe('Medium Load Test', () => {
    it('should handle medium load (50 users, 10 requests each)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 50,
        requestsPerUser: 10,
        rampUpTime: 10,
        testDuration: 60,
      };

      const result = await loadTester.runLoadTest(config);

      console.log('📈 Medium Load Test Results:', result);

      // Assertions for medium load
      expect(result.errorRate).toBeLessThan(10); // Less than 10% error rate
      expect(result.averageResponseTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.p95ResponseTime).toBeLessThan(5000); // Less than 5 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(5);
    }, 120000); // 2 minute timeout
  });

  describe('Heavy Load Test', () => {
    it('should handle heavy load (100 users, 20 requests each)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 100,
        requestsPerUser: 20,
        rampUpTime: 15,
        testDuration: 120,
      };

      const result = await loadTester.runLoadTest(config);

      console.log('📈 Heavy Load Test Results:', result);

      // Assertions for heavy load
      expect(result.errorRate).toBeLessThan(15); // Less than 15% error rate
      expect(result.averageResponseTime).toBeLessThan(3000); // Less than 3 seconds
      expect(result.p95ResponseTime).toBeLessThan(10000); // Less than 10 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(10);
    }, 300000); // 5 minute timeout
  });

  describe('Stress Test', () => {
    it('should handle stress load (200 users, 50 requests each)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 200,
        requestsPerUser: 50,
        rampUpTime: 20,
        testDuration: 180,
      };

      const result = await loadTester.runLoadTest(config);

      console.log('📈 Stress Test Results:', result);

      // Stress test assertions (more lenient)
      expect(result.errorRate).toBeLessThan(25); // Less than 25% error rate
      expect(result.averageResponseTime).toBeLessThan(5000); // Less than 5 seconds
      expect(result.p95ResponseTime).toBeLessThan(15000); // Less than 15 seconds
      expect(result.requestsPerSecond).toBeGreaterThan(20);
    }, 600000); // 10 minute timeout
  });

  describe('Spike Test', () => {
    it('should handle traffic spikes (sudden load increase)', async () => {
      console.log('🌊 Starting spike test...');

      // Phase 1: Normal load
      console.log('📊 Phase 1: Normal load (20 users)');
      const normalConfig: LoadTestConfig = {
        concurrentUsers: 20,
        requestsPerUser: 5,
        rampUpTime: 5,
        testDuration: 30,
      };

      const normalResult = await loadTester.runLoadTest(normalConfig);
      console.log('📈 Normal Load Results:', normalResult);

      // Wait 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Phase 2: Spike load
      console.log('🚀 Phase 2: Spike load (200 users)');
      const spikeConfig: LoadTestConfig = {
        concurrentUsers: 200,
        requestsPerUser: 10,
        rampUpTime: 2, // Rapid ramp-up
        testDuration: 60,
      };

      const spikeResult = await loadTester.runLoadTest(spikeConfig);
      console.log('📈 Spike Load Results:', spikeResult);

      // Phase 3: Recovery
      console.log('🔄 Phase 3: Recovery (20 users)');
      const recoveryResult = await loadTester.runLoadTest(normalConfig);
      console.log('📈 Recovery Results:', recoveryResult);

      // Assertions
      expect(normalResult.errorRate).toBeLessThan(10);
      expect(spikeResult.errorRate).toBeLessThan(30); // Higher error rate during spike is acceptable
      expect(recoveryResult.errorRate).toBeLessThan(15); // Should recover
    }, 900000); // 15 minute timeout
  });

  describe('Endurance Test', () => {
    it('should maintain performance over extended period', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 30,
        requestsPerUser: 100,
        rampUpTime: 10,
        testDuration: 300, // 5 minutes
      };

      const result = await loadTester.runLoadTest(config);

      console.log('📈 Endurance Test Results:', result);

      // Endurance test assertions
      expect(result.errorRate).toBeLessThan(10);
      expect(result.averageResponseTime).toBeLessThan(2000);
      expect(result.p95ResponseTime).toBeLessThan(5000);
      
      // Check for memory leaks (response times should not degrade significantly)
      expect(result.maxResponseTime / result.minResponseTime).toBeLessThan(10);
    }, 600000); // 10 minute timeout
  });

  describe('Database Load Test', () => {
    it('should handle database-intensive operations', async () => {
      console.log('🗄️ Starting database load test...');

      const dbLoadTester = new LoadTester();
      
      // Focus on database-heavy operations
      const config: LoadTestConfig = {
        concurrentUsers: 50,
        requestsPerUser: 20,
        rampUpTime: 10,
        testDuration: 120,
      };

      // Override the request method to focus on DB operations
      const originalMakeRequest = dbLoadTester['makeRequest'];
      dbLoadTester['makeRequest'] = async function(userId: number, requestId: number, delay: number) {
        if (delay > 0) {
          await this.sleep(delay);
        }

        const requestStartTime = performance.now();
        const fullRequestId = `db-user-${userId}-req-${requestId}`;

        try {
          // Database-intensive operations
          const requestType = requestId % 3;
          let response;

          switch (requestType) {
            case 0:
              // Complex query with joins
              response = await axios.get(`${API_BASE}/toll/events/complex`, {
                headers: { Authorization: 'Bearer mock-token' },
                params: { 
                  startDate: '2023-01-01',
                  endDate: '2023-12-31',
                  includeEvidence: true,
                  groupBy: 'month'
                },
                timeout: 30000,
              });
              break;

            case 1:
              // Statement generation
              response = await axios.post(`${API_BASE}/statements/generate`, {
                startDate: '2023-12-01',
                endDate: '2023-12-31',
                format: 'pdf'
              }, {
                headers: { Authorization: 'Bearer mock-token' },
                timeout: 30000,
              });
              break;

            case 2:
              // Analytics query
              response = await axios.get(`${API_BASE}/analytics/toll-summary`, {
                headers: { Authorization: 'Bearer mock-token' },
                params: {
                  year: 2023,
                  agency: 'all',
                  groupBy: 'location'
                },
                timeout: 30000,
              });
              break;
          }

          const requestEndTime = performance.now();
          const responseTime = requestEndTime - requestStartTime;

          this.results.push({
            requestId: fullRequestId,
            startTime: requestStartTime,
            endTime: requestEndTime,
            status: 'success',
            responseTime,
          });

        } catch (error) {
          const requestEndTime = performance.now();
          const responseTime = requestEndTime - requestStartTime;

          this.results.push({
            requestId: fullRequestId,
            startTime: requestStartTime,
            endTime: requestEndTime,
            status: 'error',
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      };

      const result = await dbLoadTester.runLoadTest(config);

      console.log('📈 Database Load Test Results:', result);

      // Database load test assertions
      expect(result.errorRate).toBeLessThan(15);
      expect(result.averageResponseTime).toBeLessThan(5000); // DB operations can be slower
      expect(result.p95ResponseTime).toBeLessThan(10000);
    }, 300000); // 5 minute timeout
  });
});
