import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/helpers';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import prisma from '../config/database';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Retry utility for database operations with exponential backoff
 */
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      // Only retry on transient errors (timeouts, connection errors)
      const isTransientError =
        (error as { code?: string }).code === 'ETIMEDOUT' ||
        (error as { code?: string }).code === 'ECONNRESET' ||
        (error as { code?: string }).code === 'ENOTFOUND' ||
        (error as { code?: string }).code === 'P1001' || // Prisma connection error
        (error as { code?: string }).code === 'P1008' || // Prisma timeout error
        (error as { code?: string }).code === 'P1017'; // Prisma server closed connection

      if (!isTransientError || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: wait before retrying
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Retrying database operation (attempt ${attempt + 2}/${maxRetries})...`);
    }
  }

  throw lastError;
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      errorResponse(res, ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Check if user exists with retry logic for transient errors
    const user = await retryDbOperation(async () => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    if (!user) {
      errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Role authorization middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      errorResponse(res, ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
};
