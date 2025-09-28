import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/securityHeaders';
import { API_CONFIG, RATE_LIMITS } from '@toll-hub/shared';

/**
 * Elite Authentication Service
 * 
 * This service provides comprehensive authentication and authorization
 * for the Toll Hub platform with enterprise-grade security features:
 * 
 * Key Features:
 * - JWT-based authentication with refresh tokens
 * - Multi-factor authentication (TOTP, SMS)
 * - Password policy enforcement
 * - Account lockout protection
 * - Session management with Redis
 * - Comprehensive audit logging
 * - Rate limiting and DDoS protection
 * - Security headers and CORS
 * 
 * Architecture Decisions:
 * - Stateless JWT tokens for scalability
 * - Redis for session storage and rate limiting
 * - bcrypt for password hashing with configurable rounds
 * - Speakeasy for TOTP MFA implementation
 * - Twilio for SMS-based MFA
 * - Comprehensive input validation with Joi
 * - Structured logging with Winston
 */

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: API_CONFIG.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: API_CONFIG.MAX_REQUEST_SIZE }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.LOGIN.window,
  max: RATE_LIMITS.AUTH.LOGIN.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.GENERAL.window,
  max: RATE_LIMITS.API.GENERAL.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom middleware
app.use(requestLogger);
app.use(securityHeaders);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes with rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', generalLimiter, userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      requestId: req.headers['x-request-id'] as string,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
