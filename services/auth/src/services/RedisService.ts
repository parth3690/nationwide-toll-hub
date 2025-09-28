import { createClient, RedisClientType } from 'redis';

/**
 * Elite Redis Service
 * 
 * Provides comprehensive Redis operations with:
 * - Connection management
 * - Key-value operations
 * - Expiration handling
 * - Error handling
 * - Connection retry logic
 * 
 * Architecture Decisions:
 * - Redis for session storage and caching
 * - Connection pooling for performance
 * - Automatic reconnection
 * - Key expiration management
 * - Structured data serialization
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

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
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

  // Basic operations
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

  async delete(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
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

  async ttl(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      throw error;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      await this.connect();
      return await this.client.hGet(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.hSet(key, field, value);
    } catch (error) {
      console.error('Redis HSET error:', error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      await this.connect();
      return await this.client.hGetAll(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.hDel(key, field);
    } catch (error) {
      console.error('Redis HDEL error:', error);
      throw error;
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      await this.connect();
      return await this.client.lPush(key, values);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      throw error;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      await this.connect();
      return await this.client.rPush(key, values);
    } catch (error) {
      console.error('Redis RPUSH error:', error);
      throw error;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      await this.connect();
      return await this.client.lPop(key);
    } catch (error) {
      console.error('Redis LPOP error:', error);
      throw error;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      await this.connect();
      return await this.client.rPop(key);
    } catch (error) {
      console.error('Redis RPOP error:', error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.lLen(key);
    } catch (error) {
      console.error('Redis LLEN error:', error);
      throw error;
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      await this.connect();
      return await this.client.sAdd(key, members);
    } catch (error) {
      console.error('Redis SADD error:', error);
      throw error;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      await this.connect();
      return await this.client.sRem(key, members);
    } catch (error) {
      console.error('Redis SREM error:', error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.sMembers(key);
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      throw error;
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.sIsMember(key, member);
      return result;
    } catch (error) {
      console.error('Redis SISMEMBER error:', error);
      throw error;
    }
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.zAdd(key, { score, value: member });
    } catch (error) {
      console.error('Redis ZADD error:', error);
      throw error;
    }
  }

  async zrem(key: string, member: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.zRem(key, member);
    } catch (error) {
      console.error('Redis ZREM error:', error);
      throw error;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.zRange(key, start, stop);
    } catch (error) {
      console.error('Redis ZRANGE error:', error);
      throw error;
    }
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.zRangeByScore(key, min, max);
    } catch (error) {
      console.error('Redis ZRANGEBYSCORE error:', error);
      throw error;
    }
  }

  async zscore(key: string, member: string): Promise<number | null> {
    try {
      await this.connect();
      return await this.client.zScore(key, member);
    } catch (error) {
      console.error('Redis ZSCORE error:', error);
      throw error;
    }
  }

  // Counter operations
  async incr(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      throw error;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    try {
      await this.connect();
      return await this.client.incrBy(key, increment);
    } catch (error) {
      console.error('Redis INCRBY error:', error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.decr(key);
    } catch (error) {
      console.error('Redis DECR error:', error);
      throw error;
    }
  }

  async decrby(key: string, decrement: number): Promise<number> {
    try {
      await this.connect();
      return await this.client.decrBy(key, decrement);
    } catch (error) {
      console.error('Redis DECRBY error:', error);
      throw error;
    }
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      await this.connect();
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      throw error;
    }
  }

  async scan(cursor: number, pattern?: string, count?: number): Promise<{ cursor: number; keys: string[] }> {
    try {
      await this.connect();
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: count,
      });
      return {
        cursor: result.cursor,
        keys: result.keys,
      };
    } catch (error) {
      console.error('Redis SCAN error:', error);
      throw error;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      await this.connect();
      return await this.client.publish(channel, message);
    } catch (error) {
      console.error('Redis PUBLISH error:', error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.connect();
      await this.client.subscribe(channel, callback);
    } catch (error) {
      console.error('Redis SUBSCRIBE error:', error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.connect();
      await this.client.unsubscribe(channel);
    } catch (error) {
      console.error('Redis UNSUBSCRIBE error:', error);
      throw error;
    }
  }

  // Transaction operations
  async multi(): Promise<any> {
    try {
      await this.connect();
      return this.client.multi();
    } catch (error) {
      console.error('Redis MULTI error:', error);
      throw error;
    }
  }

  async exec(transaction: any): Promise<any[]> {
    try {
      await this.connect();
      return await transaction.exec();
    } catch (error) {
      console.error('Redis EXEC error:', error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<string> {
    try {
      await this.connect();
      return await this.client.ping();
    } catch (error) {
      console.error('Redis PING error:', error);
      throw error;
    }
  }

  // Info
  async info(section?: string): Promise<string> {
    try {
      await this.connect();
      return await this.client.info(section);
    } catch (error) {
      console.error('Redis INFO error:', error);
      throw error;
    }
  }

  // Flush database
  async flushdb(): Promise<void> {
    try {
      await this.connect();
      await this.client.flushDb();
    } catch (error) {
      console.error('Redis FLUSHDB error:', error);
      throw error;
    }
  }

  // Close connection
  async quit(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
