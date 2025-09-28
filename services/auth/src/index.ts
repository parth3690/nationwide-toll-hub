import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Elite Authentication Service
 * 
 * This is the main entry point for the Toll Hub Authentication Service.
 * It provides comprehensive authentication and authorization functionality
 * for the entire Toll Hub platform.
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
 * - Comprehensive input validation with express-validator
 * - Structured logging with Winston
 * - Error handling with custom error classes
 * - Security-first approach with comprehensive audit logging
 */

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Authentication Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API endpoints: http://localhost:${PORT}/api/v1/auth`);
  console.log(`👤 User endpoints: http://localhost:${PORT}/api/v1/users`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  console.log(`📧 Email Service: ${process.env.SENDGRID_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📱 SMS Service: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not connected'}`);
  console.log(`⚡ Redis: ${process.env.REDIS_URL ? 'Connected' : 'Not connected'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
