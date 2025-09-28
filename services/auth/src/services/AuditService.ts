import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { createError, ERROR_CODES } from '@toll-hub/shared';

/**
 * Elite Audit Service
 * 
 * Provides comprehensive audit logging and security event tracking with:
 * - Security event logging
 * - User activity tracking
 * - System event monitoring
 * - Compliance reporting
 * - Real-time alerting
 * 
 * Architecture Decisions:
 * - Structured logging for consistency
 * - Multiple storage backends for redundancy
 * - Real-time event processing
 * - Comprehensive security coverage
 * - Compliance with audit requirements
 */

export interface SecurityEvent {
  userId?: string;
  action: string;
  details: {
    ip?: string;
    userAgent?: string;
    email?: string;
    reason?: string;
    error?: string;
    [key: string]: any;
  };
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'authentication' | 'authorization' | 'data_access' | 'system' | 'security';
}

export interface UserActivity {
  userId: string;
  action: string;
  resource: string;
  details: {
    ip?: string;
    userAgent?: string;
    changes?: any;
    [key: string]: any;
  };
  timestamp?: Date;
}

export interface SystemEvent {
  service: string;
  event: string;
  details: {
    level: 'info' | 'warn' | 'error' | 'critical';
    message: string;
    [key: string]: any;
  };
  timestamp?: Date;
}

export class AuditService {
  private db: DatabaseService;
  private redis: RedisService;

  constructor() {
    this.db = new DatabaseService();
    this.redis = new RedisService();
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const auditLog = {
        id: this.generateId(),
        userId: event.userId,
        entityType: 'security_event',
        entityId: this.generateId(),
        action: event.action,
        changes: {
          ...event.details,
          severity: event.severity || 'medium',
          category: event.category || 'security',
          timestamp: event.timestamp || new Date(),
        },
        ipAddress: event.details.ip,
        userAgent: event.details.userAgent,
        createdAt: new Date(),
      };

      // Store in database
      await this.db.createAuditLog(auditLog);

      // Store in Redis for real-time monitoring
      await this.redis.setWithExpiry(
        `audit:security:${auditLog.id}`,
        JSON.stringify(auditLog),
        7 * 24 * 60 * 60 // 7 days
      );

      // Check for critical events that need immediate attention
      if (event.severity === 'critical') {
        await this.handleCriticalEvent(event);
      }

      // Update security metrics
      await this.updateSecurityMetrics(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(activity: UserActivity): Promise<void> {
    try {
      const auditLog = {
        id: this.generateId(),
        userId: activity.userId,
        entityType: 'user_activity',
        entityId: this.generateId(),
        action: activity.action,
        changes: {
          resource: activity.resource,
          ...activity.details,
          timestamp: activity.timestamp || new Date(),
        },
        ipAddress: activity.details.ip,
        userAgent: activity.details.userAgent,
        createdAt: new Date(),
      };

      // Store in database
      await this.db.createAuditLog(auditLog);

      // Store in Redis for real-time monitoring
      await this.redis.setWithExpiry(
        `audit:activity:${auditLog.id}`,
        JSON.stringify(auditLog),
        24 * 60 * 60 // 24 hours
      );

      // Update user activity metrics
      await this.updateUserActivityMetrics(activity);
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }

  /**
   * Log system event
   */
  async logSystemEvent(event: SystemEvent): Promise<void> {
    try {
      const auditLog = {
        id: this.generateId(),
        userId: null,
        entityType: 'system_event',
        entityId: this.generateId(),
        action: event.event,
        changes: {
          service: event.service,
          ...event.details,
          timestamp: event.timestamp || new Date(),
        },
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      // Store in database
      await this.db.createAuditLog(auditLog);

      // Store in Redis for real-time monitoring
      await this.redis.setWithExpiry(
        `audit:system:${auditLog.id}`,
        JSON.stringify(auditLog),
        24 * 60 * 60 // 24 hours
      );

      // Check for system errors that need attention
      if (event.details.level === 'error' || event.details.level === 'critical') {
        await this.handleSystemError(event);
      }

      // Update system metrics
      await this.updateSystemMetrics(event);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Get security events for user
   */
  async getSecurityEvents(userId: string, options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    severity?: string;
  } = {}): Promise<{ events: any[]; total: number }> {
    try {
      const { page = 1, limit = 20, startDate, endDate, action, severity } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE user_id = $1 AND entity_type = $2';
      const params: any[] = [userId, 'security_event'];
      let paramIndex = 3;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (action) {
        whereClause += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND changes->>'severity' = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      const query = `
        SELECT id, user_id, action, changes, ip_address, user_agent, created_at
        FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        events: result.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      console.error('Failed to get security events:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get security events',
        500,
        error
      );
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  } = {}): Promise<{ activities: any[]; total: number }> {
    try {
      const { page = 1, limit = 20, startDate, endDate, action } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE user_id = $1 AND entity_type = $2';
      const params: any[] = [userId, 'user_activity'];
      let paramIndex = 3;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (action) {
        whereClause += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      const query = `
        SELECT id, user_id, action, changes, ip_address, user_agent, created_at
        FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        activities: result.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get user activity',
        500,
        error
      );
    }
  }

  /**
   * Get system events
   */
  async getSystemEvents(options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    service?: string;
    level?: string;
  } = {}): Promise<{ events: any[]; total: number }> {
    try {
      const { page = 1, limit = 20, startDate, endDate, service, level } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE entity_type = $1';
      const params: any[] = ['system_event'];
      let paramIndex = 2;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (service) {
        whereClause += ` AND changes->>'service' = $${paramIndex}`;
        params.push(service);
        paramIndex++;
      }

      if (level) {
        whereClause += ` AND changes->>'level' = $${paramIndex}`;
        params.push(level);
        paramIndex++;
      }

      const query = `
        SELECT id, action, changes, created_at
        FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        this.db.query(query, params),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        events: result.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      console.error('Failed to get system events:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get system events',
        500,
        error
      );
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate, userId } = options;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      const query = `
        SELECT 
          entity_type,
          action,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(created_at) as first_event,
          MAX(created_at) as last_event
        FROM audit_logs
        ${whereClause}
        GROUP BY entity_type, action
        ORDER BY count DESC
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get audit statistics',
        500,
        error
      );
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate } = options;

      let whereClause = 'WHERE entity_type = $1';
      const params: any[] = ['security_event'];
      let paramIndex = 2;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      const query = `
        SELECT 
          action,
          changes->>'severity' as severity,
          changes->>'category' as category,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs
        ${whereClause}
        GROUP BY action, changes->>'severity', changes->>'category'
        ORDER BY count DESC
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get security metrics',
        500,
        error
      );
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // Send immediate alert to security team
      await this.redis.publish('security:critical', JSON.stringify(event));

      // Update security dashboard
      await this.redis.setWithExpiry(
        `security:critical:${this.generateId()}`,
        JSON.stringify(event),
        24 * 60 * 60 // 24 hours
      );

      // Log to security monitoring system
      console.error('CRITICAL SECURITY EVENT:', event);
    } catch (error) {
      console.error('Failed to handle critical event:', error);
    }
  }

  /**
   * Handle system errors
   */
  private async handleSystemError(event: SystemEvent): Promise<void> {
    try {
      // Send alert to operations team
      await this.redis.publish('system:error', JSON.stringify(event));

      // Update system health dashboard
      await this.redis.setWithExpiry(
        `system:error:${this.generateId()}`,
        JSON.stringify(event),
        24 * 60 * 60 // 24 hours
      );

      // Log to system monitoring
      console.error('SYSTEM ERROR:', event);
    } catch (error) {
      console.error('Failed to handle system error:', error);
    }
  }

  /**
   * Update security metrics
   */
  private async updateSecurityMetrics(event: SecurityEvent): Promise<void> {
    try {
      const key = `metrics:security:${event.action}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours

      if (event.severity) {
        const severityKey = `metrics:security:severity:${event.severity}`;
        await this.redis.incr(severityKey);
        await this.redis.expire(severityKey, 24 * 60 * 60);
      }
    } catch (error) {
      console.error('Failed to update security metrics:', error);
    }
  }

  /**
   * Update user activity metrics
   */
  private async updateUserActivityMetrics(activity: UserActivity): Promise<void> {
    try {
      const key = `metrics:activity:${activity.action}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours

      const userKey = `metrics:user:${activity.userId}:${activity.action}`;
      await this.redis.incr(userKey);
      await this.redis.expire(userKey, 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to update user activity metrics:', error);
    }
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(event: SystemEvent): Promise<void> {
    try {
      const key = `metrics:system:${event.service}:${event.event}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours

      if (event.details.level) {
        const levelKey = `metrics:system:level:${event.details.level}`;
        await this.redis.incr(levelKey);
        await this.redis.expire(levelKey, 24 * 60 * 60);
      }
    } catch (error) {
      console.error('Failed to update system metrics:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
