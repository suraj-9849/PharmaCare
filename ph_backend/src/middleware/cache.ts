import { Request, Response, NextFunction } from 'express';
import CacheUtil from '../utils/cache.util';
import { CacheTTL } from '../types/cache.types';

/**
 * Cache middleware for Express routes
 * Automatically caches GET request responses
 */
export const cacheMiddleware = (
  ttl: number = CacheTTL.MEDIUM,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : `route:${req.originalUrl}`;

      // Try to get cached response
      const cachedData = await CacheUtil.get(cacheKey);

      if (cachedData) {
        return res.status(200).json({
          ...cachedData,
          cached: true,
        });
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function (data: unknown) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheUtil.set(cacheKey, data, ttl).catch((err) =>
            console.error('Failed to cache response:', err)
          );
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Automatically invalidates cache patterns after modifying operations
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after response
    res.json = function (data: unknown) {
      // Invalidate cache for successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheUtil.invalidatePatterns(patterns).catch((err) =>
          console.error('Failed to invalidate cache:', err)
        );
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Custom cache key generator utilities
 */
export const cacheKeyGenerators = {
  /**
   * Generate key with user-specific data
   */
  withUser: (req: Request, prefix: string): string => {
    const userId = req.user?.id || 'anonymous';
    return `${prefix}:user:${userId}:${req.originalUrl}`;
  },

  /**
   * Generate key with query parameters
   */
  withQuery: (req: Request, prefix: string): string => {
    const queryObj = req.query as Record<string, unknown>;
    const sortedQuery = Object.keys(queryObj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = queryObj[key];
        return acc;
      }, {});
    const query = JSON.stringify(sortedQuery);
    return `${prefix}:${req.path}:${query}`;
  },

  /**
   * Generate key with path parameters
   */
  withParams: (req: Request, prefix: string): string => {
    const params = JSON.stringify(req.params);
    return `${prefix}:${req.path}:${params}`;
  },
};
