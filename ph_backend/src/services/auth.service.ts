import prisma from '../config/database';
import { comparePassword, generateToken } from '../utils/helpers';
import { LoginRequest, LoginResponse, JwtPayload, UserResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';

export class AuthService {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isValidPassword = await comparePassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Validate token and get user
   */
  async validateToken(userId: string): Promise<UserResponse | null> {
    return this.getCurrentUser(userId);
  }
}

export const authService = new AuthService();
