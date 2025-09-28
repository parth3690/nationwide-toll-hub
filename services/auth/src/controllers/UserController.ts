import { Request, Response } from 'express';
import { 
  User, 
  Vehicle, 
  PaymentMethod, 
  AgencyAccountLink, 
  TollEvent, 
  Statement, 
  Dispute,
  ApiResponse,
  ERROR_CODES,
  createError,
  generateId
} from '@toll-hub/shared';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { AuditService } from '../services/AuditService';
import { EmailService } from '../services/EmailService';
import { SmsService } from '../services/SmsService';

/**
 * Elite User Controller
 * 
 * Provides comprehensive user management functionality with:
 * - Profile management
 * - Vehicle management
 * - Payment method management
 * - Agency account linking
 * - Toll event tracking
 * - Statement management
 * - Dispute handling
 * - Security and audit logging
 * 
 * Architecture Decisions:
 * - Comprehensive user data management
 * - Real-time data synchronization
 * - Security-first approach
 * - Audit logging for all operations
 * - Error handling and validation
 */

export class UserController {
  private db: DatabaseService;
  private redis: RedisService;
  private audit: AuditService;
  private email: EmailService;
  private sms: SmsService;

  constructor() {
    this.db = new DatabaseService();
    this.redis = new RedisService();
    this.audit = new AuditService();
    this.email = new EmailService();
    this.sms = new SmsService();
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const user = await this.db.getUserById(userId);
      if (!user) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'User not found',
          404
        );
      }

      // Remove sensitive data
      const { passwordHash, mfaSecret, ...safeUser } = user;

      const response: ApiResponse<User> = {
        success: true,
        data: safeUser as User,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { firstName, lastName, phone, timezone } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      const updates: Partial<User> = {
        updatedAt: new Date(),
      };

      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (phone) updates.phone = phone;
      if (timezone) updates.timezone = timezone;

      const updatedUser = await this.db.updateUser(userId, updates);

      // Log profile update
      await this.audit.logUserActivity({
        userId,
        action: 'profile_updated',
        resource: 'user_profile',
        details: {
          ip: clientIp,
          userAgent,
          changes: updates,
        },
      });

      // Remove sensitive data
      const { passwordHash, mfaSecret, ...safeUser } = updatedUser;

      const response: ApiResponse<User> = {
        success: true,
        data: safeUser as User,
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'profile_update_failed',
        resource: 'user_profile',
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
   * Delete user account
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { password, confirmDeletion } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify password
      const user = await this.db.getUserById(userId);
      if (!user || !user.passwordHash) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid user or password',
          401
        );
      }

      const bcrypt = await import('bcrypt');
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        throw createError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid password',
          401
        );
      }

      // Soft delete user
      await this.db.deleteUser(userId);

      // Invalidate all sessions
      await this.redis.delete(`session:${userId}`);

      // Log account deletion
      await this.audit.logSecurityEvent({
        userId,
        action: 'account_deleted',
        details: {
          ip: clientIp,
          userAgent,
          reason: 'user_request',
        },
        severity: 'high',
        category: 'authentication',
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Account deleted successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logSecurityEvent({
        userId,
        action: 'account_deletion_failed',
        details: {
          ip: clientIp,
          userAgent,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        severity: 'medium',
        category: 'authentication',
      });

      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const preferences = await this.redis.get(`user:preferences:${userId}`);
      
      const response: ApiResponse = {
        success: true,
        data: preferences ? JSON.parse(preferences) : {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          privacy: {
            profileVisible: false,
            dataSharing: false,
          },
          display: {
            theme: 'light',
            language: 'en',
          },
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { notifications, privacy, display } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      const preferences = {
        notifications: notifications || {},
        privacy: privacy || {},
        display: display || {},
        updatedAt: new Date().toISOString(),
      };

      await this.redis.setWithExpiry(
        `user:preferences:${userId}`,
        JSON.stringify(preferences),
        365 * 24 * 60 * 60 // 1 year
      );

      // Log preferences update
      await this.audit.logUserActivity({
        userId,
        action: 'preferences_updated',
        resource: 'user_preferences',
        details: {
          ip: clientIp,
          userAgent,
          changes: preferences,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: preferences,
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'preferences_update_failed',
        resource: 'user_preferences',
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
   * Get user vehicles
   */
  async getVehicles(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const vehicles = await this.db.getVehiclesByUserId(userId);

      const response: ApiResponse<Vehicle[]> = {
        success: true,
        data: vehicles,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add vehicle
   */
  async addVehicle(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { plate, plateState, vehicleType, axleCount, class: vehicleClass, nickname } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      const vehicle: Partial<Vehicle> = {
        id: generateId(),
        userId,
        plate: plate.toUpperCase(),
        plateState: plateState.toUpperCase(),
        vehicleType,
        axleCount,
        class: vehicleClass,
        nickname,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newVehicle = await this.db.createVehicle(vehicle);

      // Log vehicle addition
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_added',
        resource: 'vehicle',
        details: {
          ip: clientIp,
          userAgent,
          vehicleId: newVehicle.id,
          plate: newVehicle.plate,
          plateState: newVehicle.plateState,
        },
      });

      const response: ApiResponse<Vehicle> = {
        success: true,
        data: newVehicle,
      };

      res.status(201).json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_add_failed',
        resource: 'vehicle',
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
   * Update vehicle
   */
  async updateVehicle(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const vehicleId = req.params.id;
    const updates = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify vehicle belongs to user
      const vehicle = await this.db.getVehicleById(vehicleId);
      if (!vehicle || vehicle.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Vehicle not found',
          404
        );
      }

      const updatedVehicle = await this.db.updateVehicle(vehicleId, {
        ...updates,
        updatedAt: new Date(),
      });

      // Log vehicle update
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_updated',
        resource: 'vehicle',
        details: {
          ip: clientIp,
          userAgent,
          vehicleId,
          changes: updates,
        },
      });

      const response: ApiResponse<Vehicle> = {
        success: true,
        data: updatedVehicle,
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_update_failed',
        resource: 'vehicle',
        details: {
          ip: clientIp,
          userAgent,
          vehicleId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const vehicleId = req.params.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify vehicle belongs to user
      const vehicle = await this.db.getVehicleById(vehicleId);
      if (!vehicle || vehicle.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Vehicle not found',
          404
        );
      }

      await this.db.deleteVehicle(vehicleId);

      // Log vehicle deletion
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_deleted',
        resource: 'vehicle',
        details: {
          ip: clientIp,
          userAgent,
          vehicleId,
          plate: vehicle.plate,
          plateState: vehicle.plateState,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Vehicle deleted successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'vehicle_delete_failed',
        resource: 'vehicle',
        details: {
          ip: clientIp,
          userAgent,
          vehicleId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const paymentMethods = await this.db.getPaymentMethodsByUserId(userId);

      const response: ApiResponse<PaymentMethod[]> = {
        success: true,
        data: paymentMethods,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { type, processor, processorToken, last4, brand, isDefault } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // If setting as default, unset other default payment methods
      if (isDefault) {
        const existingMethods = await this.db.getPaymentMethodsByUserId(userId);
        for (const method of existingMethods) {
          if (method.isDefault) {
            await this.db.updatePaymentMethod(method.id, { isDefault: false });
          }
        }
      }

      const paymentMethod: Partial<PaymentMethod> = {
        id: generateId(),
        userId,
        type,
        processor,
        processorToken,
        last4,
        brand,
        isDefault: isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newPaymentMethod = await this.db.createPaymentMethod(paymentMethod);

      // Log payment method addition
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_added',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId: newPaymentMethod.id,
          type: newPaymentMethod.type,
          processor: newPaymentMethod.processor,
        },
      });

      const response: ApiResponse<PaymentMethod> = {
        success: true,
        data: newPaymentMethod,
      };

      res.status(201).json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_add_failed',
        resource: 'payment_method',
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
   * Update payment method
   */
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const paymentMethodId = req.params.id;
    const updates = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify payment method belongs to user
      const paymentMethod = await this.db.getPaymentMethodById(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Payment method not found',
          404
        );
      }

      // If setting as default, unset other default payment methods
      if (updates.isDefault) {
        const existingMethods = await this.db.getPaymentMethodsByUserId(userId);
        for (const method of existingMethods) {
          if (method.isDefault && method.id !== paymentMethodId) {
            await this.db.updatePaymentMethod(method.id, { isDefault: false });
          }
        }
      }

      const updatedPaymentMethod = await this.db.updatePaymentMethod(paymentMethodId, {
        ...updates,
        updatedAt: new Date(),
      });

      // Log payment method update
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_updated',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          changes: updates,
        },
      });

      const response: ApiResponse<PaymentMethod> = {
        success: true,
        data: updatedPaymentMethod,
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_update_failed',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const paymentMethodId = req.params.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify payment method belongs to user
      const paymentMethod = await this.db.getPaymentMethodById(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Payment method not found',
          404
        );
      }

      await this.db.deletePaymentMethod(paymentMethodId);

      // Log payment method deletion
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_deleted',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          type: paymentMethod.type,
          processor: paymentMethod.processor,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Payment method deleted successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'payment_method_delete_failed',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const paymentMethodId = req.params.id;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify payment method belongs to user
      const paymentMethod = await this.db.getPaymentMethodById(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Payment method not found',
          404
        );
      }

      // Unset other default payment methods
      const existingMethods = await this.db.getPaymentMethodsByUserId(userId);
      for (const method of existingMethods) {
        if (method.isDefault && method.id !== paymentMethodId) {
          await this.db.updatePaymentMethod(method.id, { isDefault: false });
        }
      }

      // Set as default
      await this.db.updatePaymentMethod(paymentMethodId, {
        isDefault: true,
        updatedAt: new Date(),
      });

      // Log default payment method change
      await this.audit.logUserActivity({
        userId,
        action: 'default_payment_method_changed',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          type: paymentMethod.type,
          processor: paymentMethod.processor,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Default payment method updated successfully' },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'default_payment_method_change_failed',
        resource: 'payment_method',
        details: {
          ip: clientIp,
          userAgent,
          paymentMethodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  // Additional methods for agency links, toll events, statements, disputes, etc.
  // These would follow similar patterns with comprehensive error handling,
  // audit logging, and security checks.

  /**
   * Get agency account links
   */
  async getAgencyLinks(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const agencyLinks = await this.db.getAgencyAccountLinksByUserId(userId);

      const response: ApiResponse<AgencyAccountLink[]> = {
        success: true,
        data: agencyLinks,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Link agency account
   */
  async linkAgencyAccount(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { agencyId, externalAccountId, authMethod, authTokens } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      const agencyLink: Partial<AgencyAccountLink> = {
        id: generateId(),
        userId,
        agencyId,
        externalAccountId,
        status: 'pending',
        authMethod,
        authTokens,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newAgencyLink = await this.db.createAgencyAccountLink(agencyLink);

      // Log agency account linking
      await this.audit.logUserActivity({
        userId,
        action: 'agency_account_linked',
        resource: 'agency_account_link',
        details: {
          ip: clientIp,
          userAgent,
          agencyLinkId: newAgencyLink.id,
          agencyId: newAgencyLink.agencyId,
          authMethod: newAgencyLink.authMethod,
        },
      });

      const response: ApiResponse<AgencyAccountLink> = {
        success: true,
        data: newAgencyLink,
      };

      res.status(201).json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'agency_account_link_failed',
        resource: 'agency_account_link',
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
   * Get toll events
   */
  async getTollEvents(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, startDate, endDate, agencyId, status } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        agencyId: agencyId as string,
        status: status as string,
      };

      const result = await this.db.getTollEventsByUserId(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result.events,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.events.length === options.limit,
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get toll event by ID
   */
  async getTollEvent(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const eventId = req.params.id;

    try {
      const tollEvent = await this.db.getTollEventById(eventId);
      if (!tollEvent || tollEvent.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Toll event not found',
          404
        );
      }

      const response: ApiResponse<TollEvent> = {
        success: true,
        data: tollEvent,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statements
   */
  async getStatements(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
      };

      const result = await this.db.getStatementsByUserId(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result.statements,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.statements.length === options.limit,
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statement by ID
   */
  async getStatement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const statementId = req.params.id;

    try {
      const statement = await this.db.getStatementById(statementId);
      if (!statement || statement.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Statement not found',
          404
        );
      }

      const response: ApiResponse<Statement> = {
        success: true,
        data: statement,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statement items
   */
  async getStatementItems(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const statementId = req.params.id;

    try {
      // Verify statement belongs to user
      const statement = await this.db.getStatementById(statementId);
      if (!statement || statement.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Statement not found',
          404
        );
      }

      // Get statement items (this would need to be implemented in DatabaseService)
      const items = await this.db.getStatementItemsByStatementId(statementId);

      const response: ApiResponse = {
        success: true,
        data: items,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export statement
   */
  async exportStatement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const statementId = req.params.id;
    const format = req.query.format as string || 'pdf';

    try {
      // Verify statement belongs to user
      const statement = await this.db.getStatementById(statementId);
      if (!statement || statement.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Statement not found',
          404
        );
      }

      // Generate export (this would need to be implemented)
      const exportUrl = await this.generateStatementExport(statementId, format);

      const response: ApiResponse = {
        success: true,
        data: { exportUrl },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Pay statement
   */
  async payStatement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const statementId = req.params.id;
    const { paymentMethodId, amount } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify statement belongs to user
      const statement = await this.db.getStatementById(statementId);
      if (!statement || statement.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Statement not found',
          404
        );
      }

      // Verify payment method belongs to user
      const paymentMethod = await this.db.getPaymentMethodById(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Payment method not found',
          404
        );
      }

      // Process payment (this would need to be implemented)
      const paymentResult = await this.processPayment(statement, paymentMethod, amount);

      // Update statement
      await this.db.updateStatement(statementId, {
        status: 'paid',
        paymentMethodId,
        paymentTransactionId: paymentResult.transactionId,
        paidAt: new Date(),
        updatedAt: new Date(),
      });

      // Log payment
      await this.audit.logUserActivity({
        userId,
        action: 'statement_paid',
        resource: 'statement',
        details: {
          ip: clientIp,
          userAgent,
          statementId,
          paymentMethodId,
          amount: paymentResult.amount,
          transactionId: paymentResult.transactionId,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { 
          message: 'Payment processed successfully',
          transactionId: paymentResult.transactionId,
        },
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'statement_payment_failed',
        resource: 'statement',
        details: {
          ip: clientIp,
          userAgent,
          statementId,
          paymentMethodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get disputes
   */
  async getDisputes(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
      };

      const result = await this.db.getDisputesByUserId(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result.disputes,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.disputes.length === options.limit,
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dispute by ID
   */
  async getDispute(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const disputeId = req.params.id;

    try {
      const dispute = await this.db.getDisputeById(disputeId);
      if (!dispute || dispute.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Dispute not found',
          404
        );
      }

      const response: ApiResponse<Dispute> = {
        success: true,
        data: dispute,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create dispute
   */
  async createDispute(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { tollEventId, type, description, evidenceUrls } = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify toll event belongs to user
      const tollEvent = await this.db.getTollEventById(tollEventId);
      if (!tollEvent || tollEvent.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Toll event not found',
          404
        );
      }

      const dispute: Partial<Dispute> = {
        id: generateId(),
        userId,
        tollEventId,
        type,
        status: 'submitted',
        description,
        evidenceUrls: evidenceUrls || [],
        submittedAt: new Date(),
        slaDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newDispute = await this.db.createDispute(dispute);

      // Log dispute creation
      await this.audit.logUserActivity({
        userId,
        action: 'dispute_created',
        resource: 'dispute',
        details: {
          ip: clientIp,
          userAgent,
          disputeId: newDispute.id,
          tollEventId: newDispute.tollEventId,
          type: newDispute.type,
        },
      });

      const response: ApiResponse<Dispute> = {
        success: true,
        data: newDispute,
      };

      res.status(201).json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'dispute_creation_failed',
        resource: 'dispute',
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
   * Update dispute
   */
  async updateDispute(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const disputeId = req.params.id;
    const updates = req.body;
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Verify dispute belongs to user
      const dispute = await this.db.getDisputeById(disputeId);
      if (!dispute || dispute.userId !== userId) {
        throw createError(
          ERROR_CODES.NOT_FOUND,
          'Dispute not found',
          404
        );
      }

      // Only allow updates to submitted disputes
      if (dispute.status !== 'submitted') {
        throw createError(
          ERROR_CODES.VALIDATION_ERROR,
          'Cannot update resolved dispute',
          400
        );
      }

      const updatedDispute = await this.db.updateDispute(disputeId, {
        ...updates,
        updatedAt: new Date(),
      });

      // Log dispute update
      await this.audit.logUserActivity({
        userId,
        action: 'dispute_updated',
        resource: 'dispute',
        details: {
          ip: clientIp,
          userAgent,
          disputeId,
          changes: updates,
        },
      });

      const response: ApiResponse<Dispute> = {
        success: true,
        data: updatedDispute,
      };

      res.json(response);
    } catch (error) {
      await this.audit.logUserActivity({
        userId,
        action: 'dispute_update_failed',
        resource: 'dispute',
        details: {
          ip: clientIp,
          userAgent,
          disputeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  // Additional methods for user activity, security events, statistics, etc.
  // These would follow similar patterns with comprehensive error handling,
  // audit logging, and security checks.

  /**
   * Get user activity
   */
  async getUserActivity(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, startDate, endDate, action } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        action: action as string,
      };

      const result = await this.audit.getUserActivity(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result.activities,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.activities.length === options.limit,
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, startDate, endDate, action, severity } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        action: action as string,
        severity: severity as string,
      };

      const result = await this.audit.getSecurityEvents(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result.events,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.events.length === options.limit,
        },
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      // Get user statistics (this would need to be implemented)
      const statistics = await this.getUserStats(userId);

      const response: ApiResponse = {
        success: true,
        data: statistics,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      // Get dashboard data (this would need to be implemented)
      const dashboardData = await this.getDashboardStats(userId);

      const response: ApiResponse = {
        success: true,
        data: dashboardData,
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  // Helper methods (these would need to be implemented)

  private async generateStatementExport(statementId: string, format: string): Promise<string> {
    // Implementation for generating statement exports
    return `https://exports.tollhub.com/statements/${statementId}.${format}`;
  }

  private async processPayment(statement: Statement, paymentMethod: PaymentMethod, amount?: number): Promise<{ transactionId: string; amount: number }> {
    // Implementation for processing payments
    return {
      transactionId: generateId(),
      amount: amount || statement.total,
    };
  }

  private async getUserStats(userId: string): Promise<any> {
    // Implementation for getting user statistics
    return {
      totalTollEvents: 0,
      totalAmount: 0,
      totalDisputes: 0,
      totalStatements: 0,
    };
  }

  private async getDashboardStats(userId: string): Promise<any> {
    // Implementation for getting dashboard statistics
    return {
      recentTollEvents: [],
      upcomingStatements: [],
      activeDisputes: [],
      notifications: [],
    };
  }
}
