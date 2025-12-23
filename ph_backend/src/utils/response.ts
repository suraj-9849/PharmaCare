import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Send success response
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const errorResponse = (
  res: Response,
  message = 'Error',
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: string[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  message = 'Success'
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(HTTP_STATUS.OK).json(response);
};
