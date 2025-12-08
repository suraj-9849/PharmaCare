import { LoginRequest, LoginResponse, UserResponse } from '../types';
export declare class AuthService {
    /**
     * Login user
     */
    login(data: LoginRequest): Promise<LoginResponse>;
    /**
     * Get current user
     */
    getCurrentUser(userId: string): Promise<UserResponse | null>;
    /**
     * Validate token and get user
     */
    validateToken(userId: string): Promise<UserResponse | null>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map