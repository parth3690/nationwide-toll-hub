import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, ERROR_CODES, createError } from '@toll-hub/shared';
import { RedisService } from '../services/RedisService';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Elite Authentication Middleware
 * 
 * Provides comprehensive JWT token authentication with:
 * - Token validation and verification
 * - User session management
 * - Security event logging
 * - Rate limiting integration
 * - Error handling
 * 
 * Architecture Decisions:
 * - JWT for stateless authentication
 * - Redis for session management
 * - Comprehensive security checks
 * - Detailed error responses
 * - Audit logging for all events
 */

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Access token is required',
        401
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Token has expired',
        401
      );
    }

    // Check if token is blacklisted
    const redis = new RedisService();
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Token has been revoked',
        401
      );
    }

    // Check if user session exists
    const session = await redis.get(`session:${decoded.sub}`);
    if (!session) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Session not found',
        401
      );
    }

    // Parse session data
    const sessionData = JSON.parse(session);
    
    // Verify session token matches
    if (sessionData.accessToken !== token) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Invalid session token',
        401
      );
    }

    // Check if user exists and is active
    const db = new DatabaseService();
    const user = await db.getUserById(decoded.sub);
    
    if (!user) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'User not found',
        401
      );
    }

    if (user.status !== 'active') {
      throw createError(
        ERROR_CODES.ACCOUNT_SUSPENDED,
        'Account is not active',
        403
      );
    }

    // Check if email is verified (for certain operations)
    if (req.path.includes('/sensitive') && !user.emailVerified) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Email verification required',
        403
      );
    }

    // Check if MFA is required for sensitive operations
    if (req.path.includes('/sensitive') && user.mfaEnabled) {
      const mfaHeader = req.headers['x-mfa-verified'];
      if (!mfaHeader || mfaHeader !== 'true') {
        throw createError(
          ERROR_CODES.MFA_REQUIRED,
          'MFA verification required',
          401,
          { mfaRequired: true }
        );
      }
    }

    // Check rate limiting
    const rateLimitService = new (await import('../services/RateLimitService')).RateLimitService();
    await rateLimitService.checkGeneralRateLimit(decoded.sub, req.ip);

    // Increment API request count
    await rateLimitService.incrementGeneralRequests(decoded.sub, req.ip);

    // Add user information to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      status: user.status,
      roles: decoded.roles || ['user'],
      agencies: decoded.agencies || [],
      session: sessionData,
    };

    // Add token information to request
    (req as any).token = {
      sub: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
      agencies: decoded.agencies,
      iat: decoded.iat,
      exp: decoded.exp,
      jti: decoded.jti,
    };

    // Log successful authentication
    const auditService = new (await import('../services/AuditService')).AuditService();
    await auditService.logSecurityEvent({
      userId: user.id,
      action: 'token_validated',
      details: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
      },
      severity: 'low',
      category: 'authentication',
    });

    next();
  } catch (error) {
    // Log authentication failure
    const auditService = new (await import('../services/AuditService')).AuditService();
    await auditService.logSecurityEvent({
      action: 'token_validation_failed',
      details: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      severity: 'medium',
      category: 'authentication',
    });

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Invalid token',
        401
      );
    }

    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Token has expired',
        401
      );
    }

    throw error;
  }
};

/**
 * Optional authentication middleware
 * 
 * Similar to authenticateToken but doesn't throw error if token is missing
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuthenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      (req as any).user = null;
      (req as any).token = null;
      next();
      return;
    }

    // Try to authenticate, but don't throw error if it fails
    await authenticateToken(req, res, next);
  } catch (error) {
    // Authentication failed, but continue without user
    (req as any).user = null;
    (req as any).token = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * 
 * Checks if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Authentication required',
        401
      );
    }

    const userRoles = user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw createError(
        ERROR_CODES.AUTHORIZATION_ERROR,
        'Insufficient permissions',
        403
      );
    }

    next();
  };
};

/**
 * Agency access authorization middleware
 * 
 * Checks if user has access to specific agency
 */
export const requireAgencyAccess = (agencyId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Authentication required',
        401
      );
    }

    const userAgencies = user.agencies || [];
    
    if (!userAgencies.includes(agencyId)) {
      throw createError(
        ERROR_CODES.AUTHORIZATION_ERROR,
        'Access denied to this agency',
        403
      );
    }

    next();
  };
};

/**
 * MFA verification middleware
 * 
 * Ensures MFA is verified for sensitive operations
 */
export const requireMFA = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    throw createError(
      ERROR_CODES.AUTHENTICATION_ERROR,
      'Authentication required',
      401
    );
  }

  if (user.mfaEnabled) {
    const mfaHeader = req.headers['x-mfa-verified'];
    if (!mfaHeader || mfaHeader !== 'true') {
      throw createError(
        ERROR_CODES.MFA_REQUIRED,
        'MFA verification required',
        401,
        { mfaRequired: true }
      );
    }
  }

  next();
};

/**
 * Email verification middleware
 * 
 * Ensures email is verified for certain operations
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    throw createError(
      ERROR_CODES.AUTHENTICATION_ERROR,
      'Authentication required',
      401
    );
  }

  if (!user.emailVerified) {
    throw createError(
      ERROR_CODES.AUTHENTICATION_ERROR,
      'Email verification required',
      403
    );
  }

  next();
};

/**
 * Admin authorization middleware
 * 
 * Ensures user has admin role
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Super admin authorization middleware
 * 
 * Ensures user has super admin role
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Support authorization middleware
 * 
 * Ensures user has support role
 */
export const requireSupport = requireRole(['support', 'admin', 'super_admin']);

/**
 * User authorization middleware
 * 
 * Ensures user has user role or higher
 */
export const requireUser = requireRole(['user', 'support', 'admin', 'super_admin']);

/**
 * Resource ownership middleware
 * 
 * Ensures user owns the resource they're trying to access
 */
export const requireResourceOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const resourceId = req.params[resourceIdParam];
    
    if (!user) {
      throw createError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Authentication required',
        401
      );
    }

    // For now, just check if the resource ID matches user ID
    // In a real implementation, you'd check the database
    if (resourceId !== user.id) {
      throw createError(
        ERROR_CODES.AUTHORIZATION_ERROR,
        'Access denied to this resource',
        403
      );
    }

    next();
  };
};

/**
 * Rate limiting middleware
 * 
 * Applies rate limiting to specific endpoints
 */
export const rateLimit = (limitType: 'general' | 'heavy' | 'auth') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const userId = user?.id;
      const ip = req.ip;

      const rateLimitService = new (await import('../services/RateLimitService')).RateLimitService();

      switch (limitType) {
        case 'general':
          await rateLimitService.checkGeneralRateLimit(userId, ip);
          await rateLimitService.incrementGeneralRequests(userId, ip);
          break;
        case 'heavy':
          await rateLimitService.checkHeavyRateLimit(userId, ip);
          await rateLimitService.incrementHeavyRequests(userId, ip);
          break;
        case 'auth':
          // Auth rate limiting is handled in the auth controller
          break;
      }

      next();
    } catch (error) {
      throw error;
    }
  };
};

/**
 * Security headers middleware
 * 
 * Adds security headers to responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
};

/**
 * Request logging middleware
 * 
 * Logs all incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    };
    
    console.log('Request:', logData);
  });
  
  next();
};
