"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const constants_1 = require("../constants");
const env_1 = __importDefault(require("../config/env"));
/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err);
    // Prisma errors
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'A record with this value already exists',
                    field: err.meta?.target,
                });
                return;
            case 'P2025':
                res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Record not found',
                });
                return;
            default:
                break;
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.TOKEN_INVALID,
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.TOKEN_EXPIRED,
        });
        return;
    }
    // Default error
    const statusCode = err.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.default.isDevelopment && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map