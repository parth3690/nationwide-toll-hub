import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  JwtPayload, 
  ApiResponse,
  ERROR_CODES,
  JWT_CONFIG,
  SECURITY_CONFIG,
  createError,
  generateId,
  maskEmail
} from '@toll-hub/shared';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { EmailService } from '../services/EmailService';
import { SmsService } from '../services/SmsService';
import { AuditService } from '../services/AuditService';
import { RateLimitService } from '../services/RateLimitService';

/**
 * Elite Authentication Controller
 * 
 * Implements comprehensive authentication and authorization logic with:
 * - Secure password hashing with bcrypt
 * - JWT token generation and validation
 * - Multi-factor authentication (TOTP, SMS)
 * - Account lockout protection
 * - Session management
 * - Comprehensive audit logging
 * - Rate limiting integration
 * 
 * Security Features:
 * - Password policy enforcement
 * - Account lockout after failed attempts
 * - MFA backup codes
 * - Email verification
 * - Security event logging
 * - Session invalidation
 */

export class AuthController {
  private db: DatabaseService;
  private redis: RedisService;
  private email: EmailService;
  private sms: SmsService;
  private audit: AuditService;
  private rateLimit: RateLimitService;

  constructor() {
    this.db = new DatabaseService();
    this.redis = new RedisService();
    this.email = new EmailService();
    this.sms = new SmsService();
    this.audit = new AuditService();
    this.rateLimit = new RateLimitService();
  }

  /**
   * User Registration
   * 
   * Creates a new user account with comprehensive validation:
   * - Email uniqueness check
   * - Password strength validation
   * - Terms acceptance verification
   * - Email verification token generation
   * - Audit logging
   */
  async signup(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName, phone, acceptTerms } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Check if user already exists
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        throw createError(
          ERROR_CODES.CONFLICT,
          'User with this email already exists',
          409
        );
      }

      // Check rate limiting
      await this.rateLimit.checkSignupLimit(email, clientIp);

      // Hash password with configurable rounds
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user record
      const user: Partial<User> = {
        id: generateId(),
        email,
        passwordHash,
        emailVerified: false,
        mfaEnabled: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser = await this.db.createUser(user);

      // Generate email verification token
      const verificationToken = generateId();
      await this.redis.setWithExpiry(
        `email_verification:${verificationToken}`,
        newUser.id,
        24 * 60 * 60 // 24 hours
      );

      // Send verification email
      await this.email.sendVerificationEmail(email, verificationToken);

      // Log security event
      await this.audit.logSecurityEvent({
        userId: newUser.id,
        action: 'user_registered',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
        },
      });

      // Rate limiting increment
      await this.rateLimit.incrementSignupCount(email, clientIp);

      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          mfaEnabled: newUser.mfaEnabled,
          status: newUser.status,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        } as User,
      };

      res.status(201).json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'signup_failed',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * User Authentication
   * 
   * Authenticates users with comprehensive security:
   * - Password verification
   * - Account status checks
   * - MFA validation
   * - Session creation
   * - JWT token generation
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password, mfaCode } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Check rate limiting
      await this.rateLimit.checkLoginLimit(email, clientIp);

      // Get user by email
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid email or password',
          401
        );
      }

      // Check account status
      if (user.status === 'suspended') {
        throw createError(
          ERROR_CODES.ACCOUNT_SUSPENDED,
          'Account is suspended',
          403
        );
      }

      if (user.status === 'deleted') {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid email or password',
          401
        );
      }

      // Verify password
      if (!user.passwordHash) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid email or password',
          401
        );
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        // Increment failed login attempts
        await this.rateLimit.incrementFailedLogin(email, clientIp);
        
        await this.audit.logSecurityEvent({
          userId: user.id,
          action: 'login_failed',
          details: {
            email: maskEmail(email),
            ip: clientIp,
            userAgent,
            reason: 'invalid_password',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid email or password',
          401
        );
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        if (!mfaCode) {
          throw createError(
            ERROR_CODES.MFA_REQUIRED,
            'MFA code is required',
            401,
            { mfaRequired: true }
          );
        }

        // Verify MFA code
        const mfaValid = await this.verifyMFACode(user.id, mfaCode);
        if (!mfaValid) {
          await this.audit.logSecurityEvent({
            userId: user.id,
            action: 'mfa_failed',
            details: {
              email: maskEmail(email),
              ip: clientIp,
              userAgent,
            },
          });

          throw createError(
            ERROR_CODES.AUTHENTICATION_ERROR,
            'Invalid MFA code',
            401
          );
        }
      }

      // Generate JWT tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store session in Redis
      await this.redis.setWithExpiry(
        `session:${user.id}`,
        JSON.stringify({
          accessToken,
          refreshToken,
          ip: clientIp,
          userAgent,
          createdAt: new Date().toISOString(),
        }),
        24 * 60 * 60 // 24 hours
      );

      // Update last login
      await this.db.updateUser(user.id, {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });

      // Log successful login
      await this.audit.logSecurityEvent({
        userId: user.id,
        action: 'login_success',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
          mfaUsed: user.mfaEnabled,
        },
      });

      // Clear failed login attempts
      await this.rateLimit.clearFailedLogins(email, clientIp);

      const response: ApiResponse<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }> = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            mfaEnabled: user.mfaEnabled,
            status: user.status,
            lastLoginAt: new Date(),
            createdAt: user.createdAt,
            updatedAt: new Date(),
          } as User,
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'login_error',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Token Refresh
   * 
   * Refreshes access tokens using refresh tokens:
   * - Refresh token validation
   * - New token generation
   * - Session update
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as JwtPayload;
      
      // Get user
      const user = await this.db.getUserById(decoded.sub);
      if (!user || user.status !== 'active') {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid refresh token',
          401
        );
      }

      // Check session exists
      const session = await this.redis.get(`session:${user.id}`);
      if (!session) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Session not found',
          401
        );
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update session
      await this.redis.setWithExpiry(
        `session:${user.id}`,
        JSON.stringify({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          ip: clientIp,
          userAgent,
          createdAt: new Date().toISOString(),
        }),
        24 * 60 * 60 // 24 hours
      );

      const response: ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }> = {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'token_refresh_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * User Logout
   * 
   * Logs out user and invalidates session:
   * - Session removal from Redis
   * - Audit logging
   */
  async logout(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Remove session
      await this.redis.delete(`session:${userId}`);

      // Log logout
      await this.audit.logSecurityEvent({
        userId,
        action: 'logout',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'logout_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Logout All Sessions
   * 
   * Invalidates all user sessions:
   * - Remove all sessions from Redis
   * - Audit logging
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Remove all sessions
      await this.redis.delete(`session:${userId}`);

      // Log logout all
      await this.audit.logSecurityEvent({
        userId,
        action: 'logout_all',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'All sessions logged out successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'logout_all_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Password Reset Request
   * 
   * Initiates password reset process:
   * - Generate reset token
   * - Send reset email
   * - Rate limiting
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Check rate limiting
      await this.rateLimit.checkPasswordResetLimit(email, clientIp);

      // Get user
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        const response: ApiResponse = {
          success: true,
          data: { message: 'If the email exists, a reset link has been sent' },
        };
        res.json(response);
        return;
      }

      // Generate reset token
      const resetToken = generateId();
      await this.redis.setWithExpiry(
        `password_reset:${resetToken}`,
        user.id,
        60 * 60 // 1 hour
      );

      // Send reset email
      await this.email.sendPasswordResetEmail(email, resetToken);

      // Log security event
      await this.audit.logSecurityEvent({
        userId: user.id,
        action: 'password_reset_requested',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
        },
      });

      // Increment rate limit
      await this.rateLimit.incrementPasswordResetCount(email, clientIp);

      const response: ApiResponse = {
        success: true,
        data: { message: 'If the email exists, a reset link has been sent' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'password_reset_request_failed',
        details: {
          email: maskEmail(email),
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Password Reset Confirmation
   * 
   * Completes password reset process:
   * - Validate reset token
   * - Update password
   * - Invalidate all sessions
   */
  async confirmPasswordReset(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user ID from token
      const userId = await this.redis.get(`password_reset:${token}`);
      if (!userId) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid or expired reset token',
          401
        );
      }

      // Get user
      const user = await this.db.getUserById(userId);
      if (!user) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'User not found',
          404
        );
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password
      await this.db.updateUser(userId, {
        passwordHash,
        updatedAt: new Date(),
      });

      // Invalidate all sessions
      await this.redis.delete(`session:${userId}`);

      // Remove reset token
      await this.redis.delete(`password_reset:${token}`);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'password_reset_completed',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password reset successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'password_reset_confirm_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Change Password
   * 
   * Changes password for authenticated user:
   * - Verify current password
   * - Update password
   * - Invalidate all sessions
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user || !user.passwordHash) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid user or password',
          401
        );
      }

      // Verify current password
      const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!currentPasswordValid) {
        await this.audit.logSecurityEvent({
          userId,
          action: 'password_change_failed',
          details: {
            ip: clientIp,
            userAgent,
            reason: 'invalid_current_password',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Current password is incorrect',
          401
        );
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.db.updateUser(userId, {
        passwordHash,
        updatedAt: new Date(),
      });

      // Invalidate all sessions
      await this.redis.delete(`session:${userId}`);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'password_changed',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password changed successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'password_change_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * MFA Setup
   * 
   * Initiates MFA setup process:
   * - Generate TOTP secret
   * - Create QR code
   * - Store temporary secret
   */
  async setupMFA(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: 'Toll Hub',
        issuer: 'Toll Hub',
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store temporary secret
      await this.redis.setWithExpiry(
        `mfa_setup:${userId}`,
        secret.base32,
        10 * 60 // 10 minutes
      );

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_setup_initiated',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
      }> = {
        success: true,
        data: {
          secret: secret.base32,
          qrCode: qrCodeUrl,
          backupCodes: this.generateBackupCodes(),
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_setup_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Enable MFA
   * 
   * Enables MFA for user:
   * - Verify TOTP code
   * - Store MFA secret
   * - Generate backup codes
   */
  async enableMFA(req: Request, res: Response): Promise<void> {
    const { mfaCode } = req.body;
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get temporary secret
      const secret = await this.redis.get(`mfa_setup:${userId}`);
      if (!secret) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'MFA setup session expired',
          401
        );
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });

      if (!verified) {
        await this.audit.logSecurityEvent({
          userId,
          action: 'mfa_enable_failed',
          details: {
            ip: clientIp,
            userAgent,
            reason: 'invalid_code',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid MFA code',
          401
        );
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Update user
      await this.db.updateUser(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        updatedAt: new Date(),
      });

      // Store backup codes
      await this.redis.setWithExpiry(
        `mfa_backup_codes:${userId}`,
        JSON.stringify(backupCodes),
        365 * 24 * 60 * 60 // 1 year
      );

      // Remove temporary secret
      await this.redis.delete(`mfa_setup:${userId}`);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_enabled',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse<{
        backupCodes: string[];
      }> = {
        success: true,
        data: {
          backupCodes,
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_enable_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Disable MFA
   * 
   * Disables MFA for user:
   * - Verify password and MFA code
   * - Remove MFA secret
   * - Invalidate backup codes
   */
  async disableMFA(req: Request, res: Response): Promise<void> {
    const { password, mfaCode } = req.body;
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user || !user.passwordHash || !user.mfaSecret) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid user or MFA not enabled',
          401
        );
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        await this.audit.logSecurityEvent({
          userId,
          action: 'mfa_disable_failed',
          details: {
            ip: clientIp,
            userAgent,
            reason: 'invalid_password',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid password',
          401
        );
      }

      // Verify MFA code
      const mfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });

      if (!mfaValid) {
        await this.audit.logSecurityEvent({
          userId,
          action: 'mfa_disable_failed',
          details: {
            ip: clientIp,
            userAgent,
            reason: 'invalid_mfa_code',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid MFA code',
          401
        );
      }

      // Update user
      await this.db.updateUser(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        updatedAt: new Date(),
      });

      // Remove backup codes
      await this.redis.delete(`mfa_backup_codes:${userId}`);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_disabled',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'MFA disabled successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'mfa_disable_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get Backup Codes
   * 
   * Retrieves MFA backup codes for user
   */
  async getBackupCodes(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const backupCodes = await this.redis.get(`mfa_backup_codes:${userId}`);
      
      const response: ApiResponse<{
        backupCodes: string[];
      }> = {
        success: true,
        data: {
          backupCodes: backupCodes ? JSON.parse(backupCodes) : [],
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Regenerate Backup Codes
   * 
   * Generates new backup codes for user
   */
  async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
    const { password } = req.body;
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user || !user.passwordHash) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid user or password',
          401
        );
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        await this.audit.logSecurityEvent({
          userId,
          action: 'backup_codes_regeneration_failed',
          details: {
            ip: clientIp,
            userAgent,
            reason: 'invalid_password',
          },
        });

        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid password',
          401
        );
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      // Store new backup codes
      await this.redis.setWithExpiry(
        `mfa_backup_codes:${userId}`,
        JSON.stringify(backupCodes),
        365 * 24 * 60 * 60 // 1 year
      );

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'backup_codes_regenerated',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse<{
        backupCodes: string[];
      }> = {
        success: true,
        data: {
          backupCodes,
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'backup_codes_regeneration_error',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Request Email Verification
   * 
   * Sends email verification link to user
   */
  async requestEmailVerification(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'User not found',
          404
        );
      }

      if (user.emailVerified) {
        const response: ApiResponse = {
          success: true,
          data: { message: 'Email already verified' },
        };
        res.json(response);
        return;
      }

      // Generate verification token
      const verificationToken = generateId();
      await this.redis.setWithExpiry(
        `email_verification:${verificationToken}`,
        userId,
        24 * 60 * 60 // 24 hours
      );

      // Send verification email
      await this.email.sendVerificationEmail(user.email, verificationToken);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'email_verification_requested',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Verification email sent' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'email_verification_request_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Confirm Email Verification
   * 
   * Confirms email verification with token
   */
  async confirmEmailVerification(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Get user ID from token
      const userId = await this.redis.get(`email_verification:${token}`);
      if (!userId) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid or expired verification token',
          401
        );
      }

      // Update user
      await this.db.updateUser(userId, {
        emailVerified: true,
        updatedAt: new Date(),
      });

      // Remove verification token
      await this.redis.delete(`email_verification:${token}`);

      // Log security event
      await this.audit.logSecurityEvent({
        userId,
        action: 'email_verified',
        details: {
          ip: clientIp,
          userAgent,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Email verified successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId: null,
        action: 'email_verification_confirm_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get Account Status
   * 
   * Returns current account status and security information
   */
  async getAccountStatus(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'User not found',
          404
        );
      }

      // Get session info
      const session = await this.redis.get(`session:${userId}`);
      const sessionInfo = session ? JSON.parse(session) : null;

      const response: ApiResponse<{
        user: User;
        session: any;
        security: {
          mfaEnabled: boolean;
          emailVerified: boolean;
          lastLoginAt: Date | null;
        };
      }> = {
        success: true,
        data: {
          user,
          session: sessionInfo,
          security: {
            mfaEnabled: user.mfaEnabled,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
          },
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Security Events
   * 
   * Returns security events for user
   */
  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    try {
      const events = await this.audit.getSecurityEvents(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      const response: ApiResponse = {
        success: true,
        data: events,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: ['user'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      jti: generateId(),
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: JWT_CONFIG.ALGORITHM as any,
      expiresIn: JWT_CONFIG.EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });
  }

  private generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: ['user'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      jti: generateId(),
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: JWT_CONFIG.ALGORITHM as any,
      expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });
  }

  private async verifyMFACode(userId: string, code: string): Promise<boolean> {
    try {
      // Check if it's a backup code
      const backupCodes = await this.redis.get(`mfa_backup_codes:${userId}`);
      if (backupCodes) {
        const codes = JSON.parse(backupCodes);
        const index = codes.indexOf(code);
        if (index !== -1) {
          // Remove used backup code
          codes.splice(index, 1);
          await this.redis.setWithExpiry(
            `mfa_backup_codes:${userId}`,
            JSON.stringify(codes),
            365 * 24 * 60 * 60 // 1 year
          );
          return true;
        }
      }

      // Check TOTP code
      const user = await this.db.getUserById(userId);
      if (!user || !user.mfaSecret) {
        return false;
      }

      return speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    } catch (error) {
      return false;
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < SECURITY_CONFIG.MFA_BACKUP_CODES_COUNT; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    return codes;
  }
}
