"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_service_1 = require("../services/sale.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/sales
 * Get all sales with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const result = await sale_service_1.saleService.getAllSales(Number(page), Number(limit), startDate, endDate);
        return (0, response_1.paginatedResponse)(res, result.sales, result.pagination, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/sales/today
 * Get today's sales summary
 */
router.get('/today', async (_req, res) => {
    try {
        const summary = await sale_service_1.saleService.getTodaysSalesSummary();
        return (0, response_1.successResponse)(res, summary, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/sales/stats
 * Get sales statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        const stats = await sale_service_1.saleService.getSalesStats(period);
        return (0, response_1.successResponse)(res, stats, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/sales/:id
 * Get sale by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const sale = await sale_service_1.saleService.getSaleById(req.params.id);
        return (0, response_1.successResponse)(res, sale, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        const statusCode = message === constants_1.ERROR_MESSAGES.SALE_NOT_FOUND
            ? constants_1.HTTP_STATUS.NOT_FOUND
            : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return (0, response_1.errorResponse)(res, message, statusCode);
    }
});
/**
 * POST /api/sales
 * Create new sale
 */
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.errorResponse)(res, constants_1.ERROR_MESSAGES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const data = req.body;
        const sale = await sale_service_1.saleService.createSale(req.user.id, data);
        return (0, response_1.successResponse)(res, sale, constants_1.SUCCESS_MESSAGES.SALE_COMPLETED, constants_1.HTTP_STATUS.CREATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * POST /api/sales/:id/cancel
 * Cancel sale
 */
router.post('/:id/cancel', async (req, res) => {
    try {
        const result = await sale_service_1.saleService.cancelSale(req.params.id);
        return (0, response_1.successResponse)(res, result, constants_1.SUCCESS_MESSAGES.SALE_CANCELLED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
exports.default = router;
//# sourceMappingURL=sale.routes.js.map