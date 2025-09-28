import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { UserController } from '../controllers/UserController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { 
  ERROR_CODES, 
  SECURITY_CONFIG, 
  HTTP_STATUS,
  createError 
} from '@toll-hub/shared';

const router = Router();
const userController = new UserController();

/**
 * User Routes
 * 
 * Provides comprehensive user management endpoints with:
 * - Profile management
 * - Vehicle management
 * - Payment method management
 * - Agency account linking
 * - Security settings
 * - Audit logging
 */

// Get user profile
router.get('/me', authenticateToken, userController.getProfile);

// Update user profile
router.patch('/me', [
  authenticateToken,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-US')
    .withMessage('Valid US phone number is required'),
  body('timezone')
    .optional()
    .isIn(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'])
    .withMessage('Invalid timezone'),
], validateRequest, userController.updateProfile);

// Delete user account
router.delete('/me', [
  authenticateToken,
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion'),
  body('confirmDeletion')
    .equals('DELETE')
    .withMessage('Must type DELETE to confirm account deletion'),
], validateRequest, userController.deleteAccount);

// Get user preferences
router.get('/me/preferences', authenticateToken, userController.getPreferences);

// Update user preferences
router.put('/me/preferences', [
  authenticateToken,
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy must be an object'),
  body('display')
    .optional()
    .isObject()
    .withMessage('Display must be an object'),
], validateRequest, userController.updatePreferences);

// Get user vehicles
router.get('/me/vehicles', authenticateToken, userController.getVehicles);

// Add vehicle
router.post('/me/vehicles', [
  authenticateToken,
  body('plate')
    .notEmpty()
    .isLength({ min: 1, max: 20 })
    .withMessage('Plate number is required and must be less than 20 characters'),
  body('plateState')
    .notEmpty()
    .isLength({ min: 2, max: 2 })
    .withMessage('State code is required and must be 2 characters'),
  body('vehicleType')
    .optional()
    .isString()
    .withMessage('Vehicle type must be a string'),
  body('axleCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Axle count must be between 1 and 10'),
  body('class')
    .optional()
    .isString()
    .withMessage('Vehicle class must be a string'),
  body('nickname')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nickname must be less than 100 characters'),
], validateRequest, userController.addVehicle);

// Update vehicle
router.patch('/me/vehicles/:id', [
  authenticateToken,
  body('plate')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Plate number must be less than 20 characters'),
  body('plateState')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('State code must be 2 characters'),
  body('vehicleType')
    .optional()
    .isString()
    .withMessage('Vehicle type must be a string'),
  body('axleCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Axle count must be between 1 and 10'),
  body('class')
    .optional()
    .isString()
    .withMessage('Vehicle class must be a string'),
  body('nickname')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nickname must be less than 100 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
], validateRequest, userController.updateVehicle);

// Delete vehicle
router.delete('/me/vehicles/:id', authenticateToken, userController.deleteVehicle);

// Get payment methods
router.get('/me/payment-methods', authenticateToken, userController.getPaymentMethods);

// Add payment method
router.post('/me/payment-methods', [
  authenticateToken,
  body('type')
    .isIn(['card', 'ach'])
    .withMessage('Payment method type must be card or ach'),
  body('processor')
    .notEmpty()
    .withMessage('Processor is required'),
  body('processorToken')
    .notEmpty()
    .withMessage('Processor token is required'),
  body('last4')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Last 4 digits must be 4 characters'),
  body('brand')
    .optional()
    .isString()
    .withMessage('Brand must be a string'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('Is default must be a boolean'),
], validateRequest, userController.addPaymentMethod);

// Update payment method
router.patch('/me/payment-methods/:id', [
  authenticateToken,
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('Is default must be a boolean'),
], validateRequest, userController.updatePaymentMethod);

// Delete payment method
router.delete('/me/payment-methods/:id', authenticateToken, userController.deletePaymentMethod);

// Set default payment method
router.post('/me/payment-methods/:id/set-default', authenticateToken, userController.setDefaultPaymentMethod);

// Get agency account links
router.get('/me/agency-links', authenticateToken, userController.getAgencyLinks);

// Link agency account
router.post('/me/agency-links', [
  authenticateToken,
  body('agencyId')
    .notEmpty()
    .withMessage('Agency ID is required'),
  body('externalAccountId')
    .notEmpty()
    .withMessage('External account ID is required'),
  body('authMethod')
    .isIn(['oauth', 'credentials'])
    .withMessage('Auth method must be oauth or credentials'),
  body('authTokens')
    .optional()
    .isObject()
    .withMessage('Auth tokens must be an object'),
], validateRequest, userController.linkAgencyAccount);

// Update agency account link
router.patch('/me/agency-links/:id', [
  authenticateToken,
  body('status')
    .optional()
    .isIn(['pending', 'active', 'failed', 'revoked'])
    .withMessage('Invalid status'),
  body('authTokens')
    .optional()
    .isObject()
    .withMessage('Auth tokens must be an object'),
], validateRequest, userController.updateAgencyLink);

// Delete agency account link
router.delete('/me/agency-links/:id', authenticateToken, userController.deleteAgencyLink);

// Get toll events
router.get('/me/toll-events', authenticateToken, userController.getTollEvents);

// Get toll event by ID
router.get('/me/toll-events/:id', authenticateToken, userController.getTollEvent);

// Get statements
router.get('/me/statements', authenticateToken, userController.getStatements);

// Get statement by ID
router.get('/me/statements/:id', authenticateToken, userController.getStatement);

// Get statement items
router.get('/me/statements/:id/items', authenticateToken, userController.getStatementItems);

// Export statement
router.get('/me/statements/:id/export', authenticateToken, userController.exportStatement);

// Pay statement
router.post('/me/statements/:id/pay', [
  authenticateToken,
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
], validateRequest, userController.payStatement);

// Get disputes
router.get('/me/disputes', authenticateToken, userController.getDisputes);

// Get dispute by ID
router.get('/me/disputes/:id', authenticateToken, userController.getDispute);

// Create dispute
router.post('/me/disputes', [
  authenticateToken,
  body('tollEventId')
    .notEmpty()
    .withMessage('Toll event ID is required'),
  body('type')
    .isIn(['wrong_plate', 'wrong_class', 'duplicate', 'other'])
    .withMessage('Invalid dispute type'),
  body('description')
    .notEmpty()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description is required and must be between 10 and 1000 characters'),
  body('evidenceUrls')
    .optional()
    .isArray()
    .withMessage('Evidence URLs must be an array'),
], validateRequest, userController.createDispute);

// Update dispute
router.patch('/me/disputes/:id', [
  authenticateToken,
  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('evidenceUrls')
    .optional()
    .isArray()
    .withMessage('Evidence URLs must be an array'),
], validateRequest, userController.updateDispute);

// Get user activity
router.get('/me/activity', authenticateToken, userController.getUserActivity);

// Get user security events
router.get('/me/security-events', authenticateToken, userController.getSecurityEvents);

// Get user statistics
router.get('/me/statistics', authenticateToken, userController.getUserStatistics);

// Get user dashboard data
router.get('/me/dashboard', authenticateToken, userController.getDashboardData);

// Get user notifications
router.get('/me/notifications', authenticateToken, userController.getNotifications);

// Mark notification as read
router.patch('/me/notifications/:id/read', authenticateToken, userController.markNotificationRead);

// Mark all notifications as read
router.patch('/me/notifications/read-all', authenticateToken, userController.markAllNotificationsRead);

// Get user settings
router.get('/me/settings', authenticateToken, userController.getSettings);

// Update user settings
router.put('/me/settings', [
  authenticateToken,
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy must be an object'),
  body('display')
    .optional()
    .isObject()
    .withMessage('Display must be an object'),
  body('security')
    .optional()
    .isObject()
    .withMessage('Security must be an object'),
], validateRequest, userController.updateSettings);

// Get user data export
router.get('/me/export', authenticateToken, userController.exportUserData);

// Request data deletion
router.post('/me/delete-data', [
  authenticateToken,
  body('confirmDeletion')
    .equals('DELETE')
    .withMessage('Must type DELETE to confirm data deletion'),
], validateRequest, userController.requestDataDeletion);

export { router as userRoutes };
