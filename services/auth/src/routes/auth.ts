import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { 
  ERROR_CODES, 
  SECURITY_CONFIG, 
  HTTP_STATUS,
  createError 
} from '@toll-hub/shared';

const router = Router();
const authController = new AuthController();

/**
 * Authentication Routes
 * 
 * Provides comprehensive authentication endpoints with:
 * - Input validation using express-validator
 * - Rate limiting (applied at app level)
 * - Security headers and CORS
 * - Structured error responses
 * - Audit logging for all operations
 */

// Sign up endpoint
router.post('/signup', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-US')
    .withMessage('Valid US phone number is required'),
  body('acceptTerms')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Terms and conditions must be accepted');
      }
      return true;
    }),
], validateRequest, authController.signup);

// Login endpoint
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('mfaCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits'),
], validateRequest, authController.login);

// Refresh token endpoint
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
], validateRequest, authController.refreshToken);

// Logout endpoint
router.post('/logout', authenticateToken, authController.logout);

// Logout all sessions endpoint
router.post('/logout-all', authenticateToken, authController.logoutAll);

// Password reset request
router.post('/password/reset-request', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
], validateRequest, authController.requestPasswordReset);

// Password reset confirmation
router.post('/password/reset-confirm', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
], validateRequest, authController.confirmPasswordReset);

// Change password (authenticated)
router.post('/password/change', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
], validateRequest, authController.changePassword);

// MFA setup
router.post('/mfa/setup', [
  authenticateToken,
], authController.setupMFA);

// MFA enable
router.post('/mfa/enable', [
  authenticateToken,
  body('mfaCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits'),
], validateRequest, authController.enableMFA);

// MFA disable
router.post('/mfa/disable', [
  authenticateToken,
  body('password')
    .notEmpty()
    .withMessage('Password is required for MFA disable'),
  body('mfaCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits'),
], validateRequest, authController.disableMFA);

// MFA backup codes
router.get('/mfa/backup-codes', authenticateToken, authController.getBackupCodes);
router.post('/mfa/backup-codes/regenerate', [
  authenticateToken,
  body('password')
    .notEmpty()
    .withMessage('Password is required for backup code regeneration'),
], validateRequest, authController.regenerateBackupCodes);

// Email verification
router.post('/email/verify-request', [
  authenticateToken,
], authController.requestEmailVerification);

router.post('/email/verify-confirm', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
], validateRequest, authController.confirmEmailVerification);

// Account status
router.get('/status', authenticateToken, authController.getAccountStatus);

// Security events
router.get('/security/events', authenticateToken, authController.getSecurityEvents);

export { router as authRoutes };
