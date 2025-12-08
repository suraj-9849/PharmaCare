"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drug_service_1 = require("../services/drug.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/drugs
 * Get all drugs with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const result = await drug_service_1.drugService.getAllDrugs(Number(page), Number(limit), search);
        return (0, response_1.paginatedResponse)(res, result.drugs, result.pagination, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/drugs/categories
 * Get drug categories
 */
router.get('/categories', async (_req, res) => {
    try {
        const categories = await drug_service_1.drugService.getCategories();
        return (0, response_1.successResponse)(res, categories, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/drugs/low-stock
 * Get low stock drugs
 */
router.get('/low-stock', async (_req, res) => {
    try {
        const drugs = await drug_service_1.drugService.getLowStockDrugs();
        return (0, response_1.successResponse)(res, drugs, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/drugs/:id
 * Get drug by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const drug = await drug_service_1.drugService.getDrugById(req.params.id);
        return (0, response_1.successResponse)(res, drug, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        const statusCode = message === constants_1.ERROR_MESSAGES.DRUG_NOT_FOUND
            ? constants_1.HTTP_STATUS.NOT_FOUND
            : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return (0, response_1.errorResponse)(res, message, statusCode);
    }
});
/**
 * POST /api/drugs
 * Create new drug
 */
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const drug = await drug_service_1.drugService.createDrug(data);
        return (0, response_1.successResponse)(res, drug, constants_1.SUCCESS_MESSAGES.DRUG_CREATED, constants_1.HTTP_STATUS.CREATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * PUT /api/drugs/:id
 * Update drug
 */
router.put('/:id', async (req, res) => {
    try {
        const drug = await drug_service_1.drugService.updateDrug(req.params.id, req.body);
        return (0, response_1.successResponse)(res, drug, constants_1.SUCCESS_MESSAGES.DRUG_UPDATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * DELETE /api/drugs/:id
 * Delete drug
 */
router.delete('/:id', async (req, res) => {
    try {
        await drug_service_1.drugService.deleteDrug(req.params.id);
        return (0, response_1.successResponse)(res, null, constants_1.SUCCESS_MESSAGES.DRUG_DELETED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
exports.default = router;
//# sourceMappingURL=drug.routes.js.map