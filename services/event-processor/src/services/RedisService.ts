import { createClient, RedisClientType } from 'redis';

/**
 * Redis Service for Event Processor
 * 
 * Provides Redis operations for event processing:
 * - Deduplication tracking
 * - Caching for performance
 * - Session management
 * - Rate limiting
 */

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection failed after 10 retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.connect();
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      throw error;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.connect();
      await this.client.set(key, value);
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.connect();
      await this.client.setEx(key, ttlSeconds, value);
    } catch (error) {
      console.error('Redis SETEX error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      throw error;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw error;
    }
  }
}
