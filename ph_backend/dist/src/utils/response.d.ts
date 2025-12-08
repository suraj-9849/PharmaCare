import { Response } from 'express';
import { PaginatedResponse } from '../types';
/**
 * Send success response
 */
export declare const successResponse: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
/**
 * Send error response
 */
export declare const errorResponse: (res: Response, message?: string, statusCode?: number, errors?: string[]) => Response;
/**
 * Send paginated response
 */
export declare const paginatedResponse: <T>(res: Response, data: T[], pagination: PaginatedResponse<T>["pagination"], message?: string) => Response;
//# sourceMappingURL=response.d.ts.map