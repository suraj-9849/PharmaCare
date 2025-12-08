import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
/**
 * Authentication middleware
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role authorization middleware
 */
export declare const authorize: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map