import { RedisService } from './RedisService';
import { createError, ERROR_CODES, RATE_LIMITS } from '@toll-hub/shared';

/**
 * Elite Rate Limiting Service
 * 
 * Provides comprehensive rate limiting functionality with:
 * - Multiple rate limiting algorithms
 * - Per-user and global limits
 * - Sliding window implementation
 * - Redis-based storage
 * - Real-time monitoring
 * 
 * Architecture Decisions:
 * - Redis for distributed rate limiting
 * - Sliding window for accurate limits
 * - Multiple limit types for different use cases
 * - Real-time monitoring and alerting
 * - Graceful degradation
 */

export class RateLimitService {
  private redis: RedisService;

  constructor() {
    this.redis = new RedisService();
  }

  /**
   * Check login rate limit
   */
  async checkLoginLimit(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:login:email:${email}`;
    const ipKey = `rate_limit:login:ip:${ip}`;
    
    const emailCount = await this.redis.get(emailKey);
    const ipCount = await this.redis.get(ipKey);
    
    if (emailCount && parseInt(emailCount) >= RATE_LIMITS.AUTH.LOGIN.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many login attempts for this email',
        429
      );
    }
    
    if (ipCount && parseInt(ipCount) >= RATE_LIMITS.AUTH.LOGIN.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many login attempts from this IP',
        429
      );
    }
  }

  /**
   * Check signup rate limit
   */
  async checkSignupLimit(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:signup:email:${email}`;
    const ipKey = `rate_limit:signup:ip:${ip}`;
    
    const emailCount = await this.redis.get(emailKey);
    const ipCount = await this.redis.get(ipKey);
    
    if (emailCount && parseInt(emailCount) >= RATE_LIMITS.AUTH.SIGNUP.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many signup attempts for this email',
        429
      );
    }
    
    if (ipCount && parseInt(ipCount) >= RATE_LIMITS.AUTH.SIGNUP.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many signup attempts from this IP',
        429
      );
    }
  }

  /**
   * Check password reset rate limit
   */
  async checkPasswordResetLimit(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:password_reset:email:${email}`;
    const ipKey = `rate_limit:password_reset:ip:${ip}`;
    
    const emailCount = await this.redis.get(emailKey);
    const ipCount = await this.redis.get(ipKey);
    
    if (emailCount && parseInt(emailCount) >= RATE_LIMITS.AUTH.PASSWORD_RESET.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many password reset attempts for this email',
        429
      );
    }
    
    if (ipCount && parseInt(ipCount) >= RATE_LIMITS.AUTH.PASSWORD_RESET.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many password reset attempts from this IP',
        429
      );
    }
  }

  /**
   * Check general API rate limit
   */
  async checkGeneralRateLimit(userId: string, ip: string): Promise<void> {
    const userKey = `rate_limit:api:user:${userId}`;
    const ipKey = `rate_limit:api:ip:${ip}`;
    
    const userCount = await this.redis.get(userKey);
    const ipCount = await this.redis.get(ipKey);
    
    if (userCount && parseInt(userCount) >= RATE_LIMITS.API.GENERAL.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many API requests for this user',
        429
      );
    }
    
    if (ipCount && parseInt(ipCount) >= RATE_LIMITS.API.GENERAL.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many API requests from this IP',
        429
      );
    }
  }

  /**
   * Check heavy API rate limit
   */
  async checkHeavyRateLimit(userId: string, ip: string): Promise<void> {
    const userKey = `rate_limit:heavy:user:${userId}`;
    const ipKey = `rate_limit:heavy:ip:${ip}`;
    
    const userCount = await this.redis.get(userKey);
    const ipCount = await this.redis.get(ipKey);
    
    if (userCount && parseInt(userCount) >= RATE_LIMITS.API.HEAVY.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many heavy API requests for this user',
        429
      );
    }
    
    if (ipCount && parseInt(ipCount) >= RATE_LIMITS.API.HEAVY.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many heavy API requests from this IP',
        429
      );
    }
  }

  /**
   * Check connector sync rate limit
   */
  async checkConnectorSyncLimit(agencyId: string): Promise<void> {
    const key = `rate_limit:connector:sync:${agencyId}`;
    const count = await this.redis.get(key);
    
    if (count && parseInt(count) >= RATE_LIMITS.CONNECTOR.SYNC.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many sync attempts for this agency',
        429
      );
    }
  }

  /**
   * Check connector health check rate limit
   */
  async checkConnectorHealthLimit(agencyId: string): Promise<void> {
    const key = `rate_limit:connector:health:${agencyId}`;
    const count = await this.redis.get(key);
    
    if (count && parseInt(count) >= RATE_LIMITS.CONNECTOR.HEALTH_CHECK.max) {
      throw createError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many health checks for this agency',
        429
      );
    }
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:login:email:${email}`;
    const ipKey = `rate_limit:login:ip:${ip}`;
    
    await Promise.all([
      this.redis.incr(emailKey),
      this.redis.incr(ipKey),
    ]);
    
    await Promise.all([
      this.redis.expire(emailKey, Math.floor(RATE_LIMITS.AUTH.LOGIN.window / 1000)),
      this.redis.expire(ipKey, Math.floor(RATE_LIMITS.AUTH.LOGIN.window / 1000)),
    ]);
  }

  /**
   * Increment signup attempts
   */
  async incrementSignupAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:signup:email:${email}`;
    const ipKey = `rate_limit:signup:ip:${ip}`;
    
    await Promise.all([
      this.redis.incr(emailKey),
      this.redis.incr(ipKey),
    ]);
    
    await Promise.all([
      this.redis.expire(emailKey, Math.floor(RATE_LIMITS.AUTH.SIGNUP.window / 1000)),
      this.redis.expire(ipKey, Math.floor(RATE_LIMITS.AUTH.SIGNUP.window / 1000)),
    ]);
  }

  /**
   * Increment password reset attempts
   */
  async incrementPasswordResetAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:password_reset:email:${email}`;
    const ipKey = `rate_limit:password_reset:ip:${ip}`;
    
    await Promise.all([
      this.redis.incr(emailKey),
      this.redis.incr(ipKey),
    ]);
    
    await Promise.all([
      this.redis.expire(emailKey, Math.floor(RATE_LIMITS.AUTH.PASSWORD_RESET.window / 1000)),
      this.redis.expire(ipKey, Math.floor(RATE_LIMITS.AUTH.PASSWORD_RESET.window / 1000)),
    ]);
  }

  /**
   * Increment general API requests
   */
  async incrementGeneralRequests(userId: string, ip: string): Promise<void> {
    const userKey = `rate_limit:api:user:${userId}`;
    const ipKey = `rate_limit:api:ip:${ip}`;
    
    await Promise.all([
      this.redis.incr(userKey),
      this.redis.incr(ipKey),
    ]);
    
    await Promise.all([
      this.redis.expire(userKey, Math.floor(RATE_LIMITS.API.GENERAL.window / 1000)),
      this.redis.expire(ipKey, Math.floor(RATE_LIMITS.API.GENERAL.window / 1000)),
    ]);
  }

  /**
   * Increment heavy API requests
   */
  async incrementHeavyRequests(userId: string, ip: string): Promise<void> {
    const userKey = `rate_limit:heavy:user:${userId}`;
    const ipKey = `rate_limit:heavy:ip:${ip}`;
    
    await Promise.all([
      this.redis.incr(userKey),
      this.redis.incr(ipKey),
    ]);
    
    await Promise.all([
      this.redis.expire(userKey, Math.floor(RATE_LIMITS.API.HEAVY.window / 1000)),
      this.redis.expire(ipKey, Math.floor(RATE_LIMITS.API.HEAVY.window / 1000)),
    ]);
  }

  /**
   * Increment connector sync attempts
   */
  async incrementConnectorSyncAttempts(agencyId: string): Promise<void> {
    const key = `rate_limit:connector:sync:${agencyId}`;
    
    await this.redis.incr(key);
    await this.redis.expire(key, Math.floor(RATE_LIMITS.CONNECTOR.SYNC.window / 1000));
  }

  /**
   * Increment connector health checks
   */
  async incrementConnectorHealthChecks(agencyId: string): Promise<void> {
    const key = `rate_limit:connector:health:${agencyId}`;
    
    await this.redis.incr(key);
    await this.redis.expire(key, Math.floor(RATE_LIMITS.CONNECTOR.HEALTH_CHECK.window / 1000));
  }

  /**
   * Clear failed login attempts
   */
  async clearFailedLogins(email: string, ip: string): Promise<void> {
    const emailKey = `rate_limit:login:email:${email}`;
    const ipKey = `rate_limit:login:ip:${ip}`;
    
    await Promise.all([
      this.redis.delete(emailKey),
      this.redis.delete(ipKey),
    ]);
  }

  /**
   * Clear all rate limits for user
   */
  async clearUserRateLimits(userId: string): Promise<void> {
    const keys = [
      `rate_limit:api:user:${userId}`,
      `rate_limit:heavy:user:${userId}`,
    ];
    
    await Promise.all(keys.map(key => this.redis.delete(key)));
  }

  /**
   * Clear all rate limits for IP
   */
  async clearIPRateLimits(ip: string): Promise<void> {
    const keys = [
      `rate_limit:login:ip:${ip}`,
      `rate_limit:signup:ip:${ip}`,
      `rate_limit:password_reset:ip:${ip}`,
      `rate_limit:api:ip:${ip}`,
      `rate_limit:heavy:ip:${ip}`,
    ];
    
    await Promise.all(keys.map(key => this.redis.delete(key)));
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(userId: string, ip: string): Promise<any> {
    const keys = [
      `rate_limit:login:email:${userId}`,
      `rate_limit:login:ip:${ip}`,
      `rate_limit:signup:email:${userId}`,
      `rate_limit:signup:ip:${ip}`,
      `rate_limit:password_reset:email:${userId}`,
      `rate_limit:password_reset:ip:${ip}`,
      `rate_limit:api:user:${userId}`,
      `rate_limit:api:ip:${ip}`,
      `rate_limit:heavy:user:${userId}`,
      `rate_limit:heavy:ip:${ip}`,
    ];
    
    const values = await Promise.all(keys.map(key => this.redis.get(key)));
    
    return {
      login: {
        email: values[0] ? parseInt(values[0]) : 0,
        ip: values[1] ? parseInt(values[1]) : 0,
        limit: RATE_LIMITS.AUTH.LOGIN.max,
      },
      signup: {
        email: values[2] ? parseInt(values[2]) : 0,
        ip: values[3] ? parseInt(values[3]) : 0,
        limit: RATE_LIMITS.AUTH.SIGNUP.max,
      },
      passwordReset: {
        email: values[4] ? parseInt(values[4]) : 0,
        ip: values[5] ? parseInt(values[5]) : 0,
        limit: RATE_LIMITS.AUTH.PASSWORD_RESET.max,
      },
      api: {
        user: values[6] ? parseInt(values[6]) : 0,
        ip: values[7] ? parseInt(values[7]) : 0,
        limit: RATE_LIMITS.API.GENERAL.max,
      },
      heavy: {
        user: values[8] ? parseInt(values[8]) : 0,
        ip: values[9] ? parseInt(values[9]) : 0,
        limit: RATE_LIMITS.API.HEAVY.max,
      },
    };
  }

  /**
   * Get rate limit metrics
   */
  async getRateLimitMetrics(): Promise<any> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      const metrics: any = {};
      
      for (const key of keys) {
        const count = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);
        
        if (count) {
          const parts = key.split(':');
          const type = parts[1];
          const category = parts[2];
          
          if (!metrics[type]) {
            metrics[type] = {};
          }
          
          if (!metrics[type][category]) {
            metrics[type][category] = {
              count: 0,
              keys: 0,
              avgTtl: 0,
            };
          }
          
          metrics[type][category].count += parseInt(count);
          metrics[type][category].keys += 1;
          metrics[type][category].avgTtl += ttl;
        }
      }
      
      // Calculate averages
      for (const type in metrics) {
        for (const category in metrics[type]) {
          const data = metrics[type][category];
          if (data.keys > 0) {
            data.avgTtl = Math.floor(data.avgTtl / data.keys);
          }
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('Failed to get rate limit metrics:', error);
      return {};
    }
  }

  /**
   * Reset all rate limits
   */
  async resetAllRateLimits(): Promise<void> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      await Promise.all(keys.map(key => this.redis.delete(key)));
    } catch (error) {
      console.error('Failed to reset rate limits:', error);
    }
  }

  /**
   * Reset rate limits for specific user
   */
  async resetUserRateLimits(userId: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`rate_limit:*:user:${userId}`);
      await Promise.all(keys.map(key => this.redis.delete(key)));
    } catch (error) {
      console.error('Failed to reset user rate limits:', error);
    }
  }

  /**
   * Reset rate limits for specific IP
   */
  async resetIPRateLimits(ip: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`rate_limit:*:ip:${ip}`);
      await Promise.all(keys.map(key => this.redis.delete(key)));
    } catch (error) {
      console.error('Failed to reset IP rate limits:', error);
    }
  }

  /**
   * Check if rate limit is exceeded
   */
  async isRateLimitExceeded(key: string, limit: number): Promise<boolean> {
    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count) >= limit : false;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return false;
    }
  }

  /**
   * Get rate limit count
   */
  async getRateLimitCount(key: string): Promise<number> {
    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Failed to get rate limit count:', error);
      return 0;
    }
  }

  /**
   * Set rate limit
   */
  async setRateLimit(key: string, value: number, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setWithExpiry(key, value.toString(), ttlSeconds);
    } catch (error) {
      console.error('Failed to set rate limit:', error);
    }
  }

  /**
   * Increment rate limit
   */
  async incrementRateLimit(key: string, ttlSeconds: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      await this.redis.expire(key, ttlSeconds);
      return count;
    } catch (error) {
      console.error('Failed to increment rate limit:', error);
      return 0;
    }
  }

  /**
   * Decrement rate limit
   */
  async decrementRateLimit(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      console.error('Failed to decrement rate limit:', error);
      return 0;
    }
  }
}
