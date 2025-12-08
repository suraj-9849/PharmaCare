import { JwtPayload } from '../types';
/**
 * Hash password
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash
 */
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Generate JWT token
 */
export declare const generateToken: (payload: JwtPayload) => string;
/**
 * Verify JWT token
 */
export declare const verifyToken: (token: string) => JwtPayload | null;
/**
 * Generate SKU
 */
export declare const generateSKU: (category: string, brandName: string) => string;
/**
 * Calculate pagination
 */
export declare const calculatePagination: (page: number | string, limit: number | string, total: number) => {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
    offset: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
/**
 * Format currency
 */
export declare const formatCurrency: (amount: number, currency?: string) => string;
/**
 * Check if date is expired
 */
export declare const isExpired: (expiryDate: Date | string) => boolean;
/**
 * Check if expiring soon (within specified days)
 */
export declare const isExpiringSoon: (expiryDate: Date | string, days?: number) => boolean;
/**
 * Get start of today
 */
export declare const getStartOfToday: () => Date;
/**
 * Get end of today
 */
export declare const getEndOfToday: () => Date;
//# sourceMappingURL=helpers.d.ts.map