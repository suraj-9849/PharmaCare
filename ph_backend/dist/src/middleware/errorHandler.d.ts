import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    meta?: {
        target?: string[];
    };
}
/**
 * Global error handler middleware
 */
export declare const errorHandler: (err: CustomError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * 404 Not Found handler
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map