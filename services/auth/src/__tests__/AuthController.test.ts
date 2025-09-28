import { Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { EmailService } from '../services/EmailService';
import { SmsService } from '../services/SmsService';
import { AuditService } from '../services/AuditService';
import { RateLimitService } from '../services/RateLimitService';

/**
 * Elite Auth Controller Tests
 * 
 * Comprehensive test suite for the authentication controller.
 * Tests all authentication flows, edge cases, and security scenarios.
 */

// Mock dependencies
jest.mock('../services/DatabaseService');
jest.mock('../services/RedisService');
jest.mock('../services/EmailService');
jest.mock('../services/SmsService');
jest.mock('../services/AuditService');
jest.mock('../services/RateLimitService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockDb: jest.Mocked<DatabaseService>;
  let mockRedis: jest.Mocked<RedisService>;
  let mockEmail: jest.Mocked<EmailService>;
  let mockSms: jest.Mocked<SmsService>;
  let mockAudit: jest.Mocked<AuditService>;
  let mockRateLimit: jest.Mocked<RateLimitService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Create mocks
    mockDb = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockRedis = new RedisService() as jest.Mocked<RedisService>;
    mockEmail = new EmailService() as jest.Mocked<EmailService>;
    mockSms = new SmsService() as jest.Mocked<SmsService>;
    mockAudit = new AuditService() as jest.Mocked<AuditService>;
    mockRateLimit = new RateLimitService() as jest.Mocked<RateLimitService>;

    // Create controller instance
    authController = new AuthController(
      mockDb,
      mockRedis,
      mockEmail,
      mockSms,
      mockAudit,
      mockRateLimit
    );

    // Setup mock request and response
    mockReq = {
      body: {},
      headers: {},
      ip: '127.0.0.1',
      user: undefined,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };

      mockReq.body = userData;
      mockDb.getUserByEmail.mockResolvedValue(null);
      mockDb.createUser.mockResolvedValue({
        id: 'user-123',
        ...userData,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRateLimit.checkLimit.mockResolvedValue(true);
      mockAudit.logEvent.mockResolvedValue();

      // Act
      await authController.signup(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockDb.getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockDb.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          userId: 'user-123',
        })
      );
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        'user_registration',
        expect.objectContaining({
          userId: 'user-123',
          email: userData.email,
        })
      );
    });

    it('should reject registration with existing email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockReq.body = userData;
      mockDb.getUserByEmail.mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRateLimit.checkLimit.mockResolvedValue(true);

      // Act
      await authController.signup(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User with this email already exists',
        })
      );
      expect(mockDb.createUser).not.toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockReq.body = userData;
      mockRateLimit.checkLimit.mockResolvedValue(true);

      // Act
      await authController.signup(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Password requirements'),
        })
      );
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockReq.body = userData;
      mockRateLimit.checkLimit.mockResolvedValue(false);

      // Act
      await authController.signup(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Rate limit exceeded',
        })
      );
    });
  });

  describe('login', () => {
    it('should successfully authenticate valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        passwordHash: '$2b$10$hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.body = loginData;
      mockDb.getUserByEmail.mockResolvedValue(mockUser);
      mockRateLimit.checkLimit.mockResolvedValue(true);
      mockAudit.logEvent.mockResolvedValue();

      // Mock bcrypt compare
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // Act
      await authController.login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockDb.getUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
          }),
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        'user_login',
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
        })
      );
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        passwordHash: '$2b$10$hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.body = loginData;
      mockDb.getUserByEmail.mockResolvedValue(mockUser);
      mockRateLimit.checkLimit.mockResolvedValue(true);

      // Mock bcrypt compare to return false
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // Act
      await authController.login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials',
        })
      );
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        'failed_login',
        expect.objectContaining({
          email: loginData.email,
          reason: 'Invalid password',
        })
      );
    });

    it('should reject login for non-existent user', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      mockReq.body = loginData;
      mockDb.getUserByEmail.mockResolvedValue(null);
      mockRateLimit.checkLimit.mockResolvedValue(true);

      // Act
      await authController.login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials',
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.body = { refreshToken };
      mockRedis.get.mockResolvedValue(JSON.stringify({ userId: mockUser.id }));
      mockDb.getUserById.mockResolvedValue(mockUser);
      mockAudit.logEvent.mockResolvedValue();

      // Act
      await authController.refreshToken(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`refresh_token:${refreshToken}`);
      expect(mockDb.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully',
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockReq.body = { refreshToken };
      mockRedis.get.mockResolvedValue(null);

      // Act
      await authController.refreshToken(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid refresh token',
        })
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockReq.user = mockUser;
      mockReq.body = { refreshToken: 'refresh-token' };
      mockRedis.del.mockResolvedValue(1);
      mockAudit.logEvent.mockResolvedValue();

      // Act
      await authController.logout(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:refresh-token');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        'user_logout',
        expect.objectContaining({
          userId: mockUser.id,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful',
        })
      );
    });
  });

  describe('enableMFA', () => {
    it('should successfully enable MFA for user', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockReq.user = mockUser;
      mockReq.body = { method: 'totp' };
      mockDb.updateUser.mockResolvedValue();
      mockAudit.logEvent.mockResolvedValue();

      // Act
      await authController.enableMFA(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockDb.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          mfaEnabled: true,
          mfaMethod: 'totp',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'MFA enabled successfully',
        })
      );
    });
  });

  describe('verifyMFA', () => {
    it('should successfully verify MFA code', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'secret',
      };
      mockReq.user = mockUser;
      mockReq.body = { code: '123456' };

      // Mock TOTP verification
      const speakeasy = require('speakeasy');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      mockAudit.logEvent.mockResolvedValue();

      // Act
      await authController.verifyMFA(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'MFA verification successful',
        })
      );
    });

    it('should reject invalid MFA code', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'secret',
      };
      mockReq.user = mockUser;
      mockReq.body = { code: '000000' };

      // Mock TOTP verification to return false
      const speakeasy = require('speakeasy');
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      // Act
      await authController.verifyMFA(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid MFA code',
        })
      );
    });
  });
});
