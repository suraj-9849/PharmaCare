"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_service_1 = require("../services/inventory.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/inventory
 * Get all inventory batches with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, drugId } = req.query;
        const result = await inventory_service_1.inventoryService.getAllBatches(Number(page), Number(limit), drugId);
        return (0, response_1.paginatedResponse)(res, result.batches, result.pagination, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/inventory/summary
 * Get stock summary
 */
router.get('/summary', async (_req, res) => {
    try {
        const summary = await inventory_service_1.inventoryService.getStockSummary();
        return (0, response_1.successResponse)(res, summary, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/inventory/expiring
 * Get expiring batches
 */
router.get('/expiring', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const batches = await inventory_service_1.inventoryService.getExpiringBatches(Number(days));
        return (0, response_1.successResponse)(res, batches, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/inventory/expired
 * Get expired batches
 */
router.get('/expired', async (_req, res) => {
    try {
        const batches = await inventory_service_1.inventoryService.getExpiredBatches();
        return (0, response_1.successResponse)(res, batches, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/inventory/drug/:drugId/available
 * Get available batches for a drug (for sale)
 */
router.get('/drug/:drugId/available', async (req, res) => {
    try {
        const batches = await inventory_service_1.inventoryService.getAvailableBatches(req.params.drugId);
        return (0, response_1.successResponse)(res, batches, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/inventory/:id
 * Get batch by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const batch = await inventory_service_1.inventoryService.getBatchById(req.params.id);
        return (0, response_1.successResponse)(res, batch, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        const statusCode = message === constants_1.ERROR_MESSAGES.BATCH_NOT_FOUND
            ? constants_1.HTTP_STATUS.NOT_FOUND
            : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return (0, response_1.errorResponse)(res, message, statusCode);
    }
});
/**
 * POST /api/inventory
 * Create new batch (stock in)
 */
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const batch = await inventory_service_1.inventoryService.createBatch(data);
        return (0, response_1.successResponse)(res, batch, constants_1.SUCCESS_MESSAGES.BATCH_ADDED, constants_1.HTTP_STATUS.CREATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * PUT /api/inventory/:id
 * Update batch
 */
router.put('/:id', async (req, res) => {
    try {
        const batch = await inventory_service_1.inventoryService.updateBatch(req.params.id, req.body);
        return (0, response_1.successResponse)(res, batch, constants_1.SUCCESS_MESSAGES.BATCH_UPDATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * DELETE /api/inventory/:id
 * Delete batch
 */
router.delete('/:id', async (req, res) => {
    try {
        await inventory_service_1.inventoryService.deleteBatch(req.params.id);
        return (0, response_1.successResponse)(res, null, 'Batch deleted successfully');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map