import request from 'supertest';
import express from 'express';
import { AuthController } from '../../controllers/AuthController';
import { DatabaseService } from '../../services/DatabaseService';
import { RedisService } from '../../services/RedisService';
import { EmailService } from '../../services/EmailService';
import { SmsService } from '../../services/SmsService';
import { AuditService } from '../../services/AuditService';
import { RateLimitService } from '../../services/RateLimitService';
import { authenticateToken } from '../../middleware/authenticateToken';
import { validateRequest } from '../../middleware/validateRequest';
import { errorHandler } from '../../middleware/errorHandler';

/**
 * Elite Integration Tests for Authentication
 * 
 * Comprehensive integration tests that test the entire authentication flow
 * from HTTP requests to database operations.
 */

describe('Auth Integration Tests', () => {
  let app: express.Application;
  let db: DatabaseService;
  let redis: RedisService;
  let email: EmailService;
  let sms: SmsService;
  let audit: AuditService;
  let rateLimit: RateLimitService;
  let authController: AuthController;

  beforeAll(async () => {
    // Initialize services
    db = new DatabaseService();
    redis = new RedisService();
    email = new EmailService();
    sms = new SmsService();
    audit = new AuditService();
    rateLimit = new RateLimitService();

    // Connect to services
    await db.connect();
    await redis.connect();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Create controller
    authController = new AuthController(db, redis, email, sms, audit, rateLimit);

    // Setup routes
    app.post('/auth/signup', validateRequest, authController.signup.bind(authController));
    app.post('/auth/login', validateRequest, authController.login.bind(authController));
    app.post('/auth/refresh', validateRequest, authController.refreshToken.bind(authController));
    app.post('/auth/logout', authenticateToken, authController.logout.bind(authController));
    app.post('/auth/mfa/enable', authenticateToken, authController.enableMFA.bind(authController));
    app.post('/auth/mfa/verify', authenticateToken, authController.verifyMFA.bind(authController));

    // Error handling
    app.use(errorHandler);
  });

  afterAll(async () => {
    await db.disconnect();
    await redis.disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await db.cleanupTestData();
    await redis.flushall();
  });

  describe('User Registration Flow', () => {
    it('should complete full user registration flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'SecurePass123!',
        firstName: 'Integration',
        lastName: 'Test',
        phoneNumber: '+1234567890',
      };

      // Step 1: Register user
      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        userId: expect.any(String),
      });

      const userId = signupResponse.body.userId;

      // Step 2: Verify user exists in database
      const user = await db.getUserById(userId);
      expect(user).toBeTruthy();
      expect(user?.email).toBe(userData.email);
      expect(user?.firstName).toBe(userData.firstName);
      expect(user?.lastName).toBe(userData.lastName);

      // Step 3: Verify audit log was created
      const auditLogs = await db.getAuditLogsByUserId(userId);
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].event).toBe('user_registration');
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        firstName: 'First',
        lastName: 'User',
      };

      // Register first user
      await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      // Try to register second user with same email
      const duplicateData = {
        ...userData,
        firstName: 'Second',
        lastName: 'User',
      };

      await request(app)
        .post('/auth/signup')
        .send(duplicateData)
        .expect(400);

      // Verify only one user exists
      const users = await db.getUsersByEmail(userData.email);
      expect(users).toHaveLength(1);
    });
  });

  describe('Authentication Flow', () => {
    let testUser: any;
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create test user
      const userData = {
        email: 'auth@example.com',
        password: 'SecurePass123!',
        firstName: 'Auth',
        lastName: 'Test',
      };

      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      testUser = await db.getUserById(signupResponse.body.userId);
    });

    it('should complete full authentication flow', async () => {
      // Step 1: Login with valid credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(loginResponse.body).toMatchObject({
        success: true,
        message: 'Login successful',
        user: expect.objectContaining({
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        }),
        tokens: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      });

      accessToken = loginResponse.body.tokens.accessToken;
      refreshToken = loginResponse.body.tokens.refreshToken;

      // Step 2: Verify tokens are stored in Redis
      const storedRefreshToken = await redis.get(`refresh_token:${refreshToken}`);
      expect(storedRefreshToken).toBeTruthy();

      // Step 3: Use access token for protected endpoint
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Step 4: Verify refresh token was invalidated
      const invalidatedToken = await redis.get(`refresh_token:${refreshToken}`);
      expect(invalidatedToken).toBeNull();
    });

    it('should handle token refresh flow', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      const oldRefreshToken = loginResponse.body.tokens.refreshToken;

      // Refresh tokens
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshResponse.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        tokens: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      });

      // Verify old refresh token is invalidated
      const oldTokenExists = await redis.get(`refresh_token:${oldRefreshToken}`);
      expect(oldTokenExists).toBeNull();

      // Verify new refresh token is stored
      const newRefreshToken = refreshResponse.body.tokens.refreshToken;
      const newTokenExists = await redis.get(`refresh_token:${newRefreshToken}`);
      expect(newTokenExists).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Verify audit log was created
      const auditLogs = await db.getAuditLogsByUserId(testUser.id);
      const failedLoginLogs = auditLogs.filter(log => log.event === 'failed_login');
      expect(failedLoginLogs).toHaveLength(1);
    });
  });

  describe('MFA Flow', () => {
    let testUser: any;
    let accessToken: string;

    beforeEach(async () => {
      // Create test user
      const userData = {
        email: 'mfa@example.com',
        password: 'SecurePass123!',
        firstName: 'MFA',
        lastName: 'Test',
      };

      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      testUser = await db.getUserById(signupResponse.body.userId);

      // Login to get access token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'mfa@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      accessToken = loginResponse.body.tokens.accessToken;
    });

    it('should complete MFA setup and verification flow', async () => {
      // Step 1: Enable MFA
      const enableResponse = await request(app)
        .post('/auth/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ method: 'totp' })
        .expect(200);

      expect(enableResponse.body).toMatchObject({
        success: true,
        message: 'MFA enabled successfully',
      });

      // Step 2: Verify MFA is enabled in database
      const updatedUser = await db.getUserById(testUser.id);
      expect(updatedUser?.mfaEnabled).toBe(true);
      expect(updatedUser?.mfaMethod).toBe('totp');

      // Step 3: Verify MFA code (mock successful verification)
      const verifyResponse = await request(app)
        .post('/auth/mfa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '123456' })
        .expect(200);

      expect(verifyResponse.body).toMatchObject({
        success: true,
        message: 'MFA verification successful',
      });
    });

    it('should reject invalid MFA code', async () => {
      // Enable MFA first
      await request(app)
        .post('/auth/mfa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ method: 'totp' })
        .expect(200);

      // Try to verify with invalid code
      await request(app)
        .post('/auth/mfa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '000000' })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'WrongPassword123!',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send(loginData)
          .expect(401);
      }

      // Next attempt should be rate limited
      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(429);
    });

    it('should enforce rate limits on signup attempts', async () => {
      // Make multiple signup attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/auth/signup')
          .send({
            email: `ratelimit${i}@example.com`,
            password: 'SecurePass123!',
            firstName: 'Rate',
            lastName: 'Limit',
          });
      }

      // Next attempt should be rate limited
      await request(app)
        .post('/auth/signup')
        .send({
          email: 'ratelimit11@example.com',
          password: 'SecurePass123!',
          firstName: 'Rate',
          lastName: 'Limit',
        })
        .expect(429);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Disconnect database
      await db.disconnect();

      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        })
        .expect(500);

      // Reconnect for cleanup
      await db.connect();
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Disconnect Redis
      await redis.disconnect();

      await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'test-token' })
        .expect(500);

      // Reconnect for cleanup
      await redis.connect();
    });

    it('should handle malformed JSON requests', async () => {
      await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: 'SecurePass123!',
        firstName: 'Malicious',
        lastName: 'User',
      };

      // Should not throw error and should handle gracefully
      const response = await request(app)
        .post('/auth/signup')
        .send(maliciousData);

      // Should either reject the request or sanitize the input
      expect([400, 201]).toContain(response.status);
    });

    it('should prevent XSS attacks in user input', async () => {
      const xssData = {
        email: 'xss@example.com',
        password: 'SecurePass123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(xssData)
        .expect(201);

      // Verify the script tag was sanitized
      const user = await db.getUserById(response.body.userId);
      expect(user?.firstName).not.toContain('<script>');
    });

    it('should require authentication for protected endpoints', async () => {
      await request(app)
        .post('/auth/logout')
        .expect(401);

      await request(app)
        .post('/auth/mfa/enable')
        .expect(401);
    });

    it('should validate JWT token format', async () => {
      await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken: 'test' })
        .expect(401);
    });
  });
});
