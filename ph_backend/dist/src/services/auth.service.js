"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class AuthService {
    /**
     * Login user
     */
    async login(data) {
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        const isValidPassword = await (0, helpers_1.comparePassword)(data.password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error(constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        const token = (0, helpers_1.generateToken)(payload);
        const userResponse = {
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
    async getCurrentUser(userId) {
        const user = await database_1.default.user.findUnique({
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
    async validateToken(userId) {
        return this.getCurrentUser(userId);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map