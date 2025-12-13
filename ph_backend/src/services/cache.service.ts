import CacheUtil from '../utils/cache.util';
import { CachePrefix, CacheTTL, CacheInvalidationPattern } from '../types/cache.types';

/**
 * Cache service providing high-level caching operations
 * for different entities in the application
 */
class CacheService {
  /**
   * Drug-related cache operations
   */
  public static readonly drug = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.DRUG, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.DRUG, id });
      return await CacheUtil.set(key, data, CacheTTL.LONG);
    },

    getList: async (params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.DRUGS_LIST,
        params,
      });
      return await CacheUtil.get(key);
    },

    setList: async (data: unknown, params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.DRUGS_LIST,
        params,
      });
      return await CacheUtil.set(key, data, CacheTTL.MEDIUM);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.DRUGS);
    },
  };

  /**
   * Customer-related cache operations
   */
  public static readonly customer = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.CUSTOMER, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.CUSTOMER, id });
      return await CacheUtil.set(key, data, CacheTTL.LONG);
    },

    getList: async (params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.CUSTOMERS_LIST,
        params,
      });
      return await CacheUtil.get(key);
    },

    setList: async (data: unknown, params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.CUSTOMERS_LIST,
        params,
      });
      return await CacheUtil.set(key, data, CacheTTL.MEDIUM);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.CUSTOMERS);
    },
  };

  /**
   * Supplier-related cache operations
   */
  public static readonly supplier = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.SUPPLIER, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.SUPPLIER, id });
      return await CacheUtil.set(key, data, CacheTTL.LONG);
    },

    getList: async (params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.SUPPLIERS_LIST,
        params,
      });
      return await CacheUtil.get(key);
    },

    setList: async (data: unknown, params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.SUPPLIERS_LIST,
        params,
      });
      return await CacheUtil.set(key, data, CacheTTL.MEDIUM);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.SUPPLIERS);
    },
  };

  /**
   * Inventory-related cache operations
   */
  public static readonly inventory = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.INVENTORY, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.INVENTORY, id });
      return await CacheUtil.set(key, data, CacheTTL.SHORT);
    },

    getLowStock: async () => {
      const key = CachePrefix.INVENTORY_LOW_STOCK;
      return await CacheUtil.get(key);
    },

    setLowStock: async (data: unknown) => {
      const key = CachePrefix.INVENTORY_LOW_STOCK;
      return await CacheUtil.set(key, data, CacheTTL.SHORT);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.INVENTORY);
    },
  };

  /**
   * Sales-related cache operations
   */
  public static readonly sale = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.SALE, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.SALE, id });
      return await CacheUtil.set(key, data, CacheTTL.VERY_LONG);
    },

    getList: async (params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.SALES_LIST,
        params,
      });
      return await CacheUtil.get(key);
    },

    setList: async (data: unknown, params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.SALES_LIST,
        params,
      });
      return await CacheUtil.set(key, data, CacheTTL.MEDIUM);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.SALES);
    },
  };

  /**
   * Dashboard-related cache operations
   */
  public static readonly dashboard = {
    getStats: async (period?: string) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.DASHBOARD_STATS,
        params: { period },
      });
      return await CacheUtil.get(key);
    },

    setStats: async (data: unknown, period?: string) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.DASHBOARD_STATS,
        params: { period },
      });
      return await CacheUtil.set(key, data, CacheTTL.SHORT);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.DASHBOARD);
    },
  };

  /**
   * Prescription-related cache operations
   */
  public static readonly prescription = {
    get: async (id: number) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.PRESCRIPTION, id });
      return await CacheUtil.get(key);
    },

    set: async (id: number, data: unknown) => {
      const key = CacheUtil.generateKey({ prefix: CachePrefix.PRESCRIPTION, id });
      return await CacheUtil.set(key, data, CacheTTL.LONG);
    },

    getList: async (params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.PRESCRIPTIONS_LIST,
        params,
      });
      return await CacheUtil.get(key);
    },

    setList: async (data: unknown, params?: Record<string, unknown>) => {
      const key = CacheUtil.generateKey({
        prefix: CachePrefix.PRESCRIPTIONS_LIST,
        params,
      });
      return await CacheUtil.set(key, data, CacheTTL.MEDIUM);
    },

    invalidate: async () => {
      return await CacheUtil.invalidatePatterns(CacheInvalidationPattern.PRESCRIPTIONS);
    },
  };

  /**
   * Generic cache operations for custom use cases
   */
  public static readonly generic = {
    getOrSet: async <T>(key: string, fetchFn: () => Promise<T>, ttl: number = CacheTTL.MEDIUM) => {
      return await CacheUtil.getOrSet<T>(key, fetchFn, ttl);
    },

    invalidateMultiple: async (patterns: string[]) => {
      return await CacheUtil.invalidatePatterns(patterns);
    },

    flushAll: async () => {
      return await CacheUtil.flushAll();
    },

    getStats: async () => {
      return await CacheUtil.getStats();
    },
  };
}

export default CacheService;
