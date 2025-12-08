"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, response_1.errorResponse)(res, 'Email and password are required', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await auth_service_1.authService.login({ email, password });
        return (0, response_1.successResponse)(res, result, constants_1.SUCCESS_MESSAGES.LOGIN_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
});
/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const user = await auth_service_1.authService.getCurrentUser(req.user.id);
        return (0, response_1.successResponse)(res, user, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * POST /api/auth/validate
 * Validate token
 */
router.post('/validate', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        return (0, response_1.successResponse)(res, { valid: true, user: req.user }, 'Token is valid');
    }
    catch (_error) {
        return (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.TOKEN_INVALID, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map