"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const helpers_1 = require("../utils/helpers");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const database_1 = __importDefault(require("../config/database"));
/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, helpers_1.verifyToken)(token);
        if (!decoded) {
            (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.TOKEN_INVALID, constants_1.HTTP_STATUS.UNAUTHORIZED);
            return;
        }
        // Check if user exists
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS.UNAUTHORIZED);
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
};
exports.authenticate = authenticate;
/**
 * Role authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.FORBIDDEN, constants_1.HTTP_STATUS.FORBIDDEN);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map