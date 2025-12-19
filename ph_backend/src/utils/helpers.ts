import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { JwtPayload } from '../types';

const SALT_ROUNDS = 10;

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  // JWT library has type issues with secret and options - using any is necessary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const secret = env.JWT_SECRET as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    expiresIn: env.JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, secret, options);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Generate SKU
 */
export const generateSKU = (category: string, brandName: string): string => {
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const brandPrefix = brandName.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${categoryPrefix}-${brandPrefix}-${random}`;
};

/**
 * Calculate pagination
 */
export const calculatePagination = (
  page: number | string,
  limit: number | string,
  total: number
) => {
  const currentPage = parseInt(String(page)) || 1;
  const itemsPerPage = parseInt(String(limit)) || 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems: total,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Check if date is expired
 */
export const isExpired = (expiryDate: Date | string): boolean => {
  return new Date(expiryDate) < new Date();
};

/**
 * Check if expiring soon (within specified days)
 */
export const isExpiringSoon = (expiryDate: Date | string, days = 30): boolean => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= days;
};

/**
 * Get start of today
 */
export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get end of today
 */
export const getEndOfToday = (): Date => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};
