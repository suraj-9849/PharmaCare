/**
 * Cache key patterns and types for type-safe cache operations
 */
export enum CachePrefix {
  DRUG = 'drug',
  DRUGS_LIST = 'drugs:list',
  CUSTOMER = 'customer',
  CUSTOMERS_LIST = 'customers:list',
  SUPPLIER = 'supplier',
  SUPPLIERS_LIST = 'suppliers:list',
  INVENTORY = 'inventory',
  INVENTORY_LOW_STOCK = 'inventory:low-stock',
  SALE = 'sale',
  SALES_LIST = 'sales:list',
  PRESCRIPTION = 'prescription',
  PRESCRIPTIONS_LIST = 'prescriptions:list',
  DASHBOARD_STATS = 'dashboard:stats',
  SMART_SHELF = 'smart-shelf',
  INVOICE = 'invoice',
  REORDER = 'reorder',
}

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

/**
 * Cache invalidation patterns
 */
export const CacheInvalidationPattern = {
  DRUGS: ['drug:*', 'drugs:*', 'inventory:*', 'dashboard:*'] as string[],
  CUSTOMERS: ['customer:*', 'customers:*', 'dashboard:*'] as string[],
  SUPPLIERS: ['supplier:*', 'suppliers:*', 'dashboard:*'] as string[],
  INVENTORY: ['inventory:*', 'drugs:*', 'dashboard:*'] as string[],
  SALES: ['sale:*', 'sales:*', 'dashboard:*', 'inventory:*'] as string[],
  PRESCRIPTIONS: ['prescription:*', 'prescriptions:*', 'dashboard:*'] as string[],
  DASHBOARD: ['dashboard:*'] as string[],
};

export type CacheKey = {
  prefix: CachePrefix;
  id?: string | number;
  params?: Record<string, unknown>;
};
