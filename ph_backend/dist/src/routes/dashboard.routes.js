"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_service_1 = require("../services/dashboard.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/dashboard
 * Get dashboard statistics
 */
router.get('/', async (_req, res) => {
    try {
        const stats = await dashboard_service_1.dashboardService.getDashboardStats();
        return (0, response_1.successResponse)(res, stats, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/dashboard/chart
 * Get sales chart data
 */
router.get('/chart', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const chartData = await dashboard_service_1.dashboardService.getSalesChartData(Number(days));
        return (0, response_1.successResponse)(res, chartData, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/dashboard/top-selling
 * Get top selling drugs
 */
router.get('/top-selling', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const topSelling = await dashboard_service_1.dashboardService.getTopSellingDrugs(Number(limit));
        return (0, response_1.successResponse)(res, topSelling, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map