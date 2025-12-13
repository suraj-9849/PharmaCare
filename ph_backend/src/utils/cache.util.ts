import { valkeyClient } from '../config/valkey';
import { config } from '../config/env';
import { CacheKey } from '../types/cache.types';

/**
 * High-quality cache utility with comprehensive error handling and type safety
 */
class CacheUtil {
  /**
   * Generate a standardized cache key
   */
  public static generateKey(cacheKey: CacheKey): string {
    const { prefix, id, params } = cacheKey;
    let key: string = prefix;

    if (id !== undefined) {
      key = `${key}:${id}`;
    }

    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map((k) => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
      key = `${key}:${sortedParams}`;
    }

    return key;
  }

  /**
   * Get cached data with automatic JSON parsing
   */
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await valkeyClient.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set cache data with automatic JSON serialization
   */
  public static async set(
    key: string,
    value: unknown,
    ttl: number = config.CACHE_TTL
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await valkeyClient.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a specific cache key
   */
  public static async delete(key: string): Promise<boolean> {
    try {
      await valkeyClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete multiple cache keys matching a pattern
   */
  public static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await valkeyClient.keys(pattern);
      if (keys.length === 0) return 0;

      const pipeline = valkeyClient.pipeline();
      keys.forEach((key) => pipeline.del(key));
      const results = await pipeline.exec();

      const deletedCount =
        results?.reduce((count, [err, deleted]) => {
          if (!err && typeof deleted === 'number') {
            return count + deleted;
          }
          return count;
        }, 0) ?? 0;

      return deletedCount;
    } catch (error) {
      console.error(`Cache delete pattern error for "${pattern}":`, error);
      return 0;
    }
  }

  /**
   * Invalidate multiple patterns at once
   */
  public static async invalidatePatterns(patterns: string[]): Promise<number> {
    try {
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await CacheUtil.deletePattern(pattern);
        totalDeleted += deleted;
      }
      return totalDeleted;
    } catch (error) {
      console.error('Cache invalidate patterns error:', error);
      return 0;
    }
  }

  /**
   * Get or set pattern: fetch from cache or compute and cache
   */
  public static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = config.CACHE_TTL
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await CacheUtil.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch fresh data
      const data = await fetchFn();

      // Cache the result
      await CacheUtil.set(key, data, ttl);

      return data;
    } catch (error) {
      console.error(`Cache getOrSet error for key "${key}":`, error);
      // Fall back to fetching without caching
      return await fetchFn();
    }
  }

  /**
   * Check if a key exists in cache
   */
  public static async exists(key: string): Promise<boolean> {
    try {
      const result = await valkeyClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key in seconds
   */
  public static async ttl(key: string): Promise<number> {
    try {
      return await valkeyClient.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key "${key}":`, error);
      return -1;
    }
  }

  /**
   * Increment a counter in cache
   */
  public static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await valkeyClient.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key "${key}":`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter in cache
   */
  public static async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await valkeyClient.decrby(key, amount);
    } catch (error) {
      console.error(`Cache decrement error for key "${key}":`, error);
      return 0;
    }
  }

  /**
   * Set expiration time for an existing key
   */
  public static async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await valkeyClient.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  public static async flushAll(): Promise<boolean> {
    try {
      await valkeyClient.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush all error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public static async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: string;
    misses: string;
  }> {
    try {
      const info = await valkeyClient.info('stats');
      const memory = await valkeyClient.info('memory');
      const keys = await valkeyClient.dbsize();

      const parseInfo = (infoStr: string, key: string): string => {
        const match = infoStr.match(new RegExp(`${key}:([^\\r\\n]+)`));
        return match ? match[1] : 'N/A';
      };

      return {
        keys,
        memory: parseInfo(memory, 'used_memory_human'),
        hits: parseInfo(info, 'keyspace_hits'),
        misses: parseInfo(info, 'keyspace_misses'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: 'N/A', hits: 'N/A', misses: 'N/A' };
    }
  }
}

export default CacheUtil;
