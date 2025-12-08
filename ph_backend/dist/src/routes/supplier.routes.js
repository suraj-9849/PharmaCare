"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_service_1 = require("../services/supplier.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/suppliers
 * Get all suppliers with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const result = await supplier_service_1.supplierService.getAllSuppliers(Number(page), Number(limit), search);
        return (0, response_1.paginatedResponse)(res, result.suppliers, result.pagination, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/suppliers/simple
 * Get all suppliers (for dropdown)
 */
router.get('/simple', async (_req, res) => {
    try {
        const suppliers = await supplier_service_1.supplierService.getAllSuppliersSimple();
        return (0, response_1.successResponse)(res, suppliers, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/suppliers/:id
 * Get supplier by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const supplier = await supplier_service_1.supplierService.getSupplierById(req.params.id);
        return (0, response_1.successResponse)(res, supplier, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        const statusCode = message === constants_1.ERROR_MESSAGES.SUPPLIER_NOT_FOUND
            ? constants_1.HTTP_STATUS.NOT_FOUND
            : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return (0, response_1.errorResponse)(res, message, statusCode);
    }
});
/**
 * POST /api/suppliers
 * Create new supplier
 */
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const supplier = await supplier_service_1.supplierService.createSupplier(data);
        return (0, response_1.successResponse)(res, supplier, constants_1.SUCCESS_MESSAGES.SUPPLIER_CREATED, constants_1.HTTP_STATUS.CREATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * PUT /api/suppliers/:id
 * Update supplier
 */
router.put('/:id', async (req, res) => {
    try {
        const supplier = await supplier_service_1.supplierService.updateSupplier(req.params.id, req.body);
        return (0, response_1.successResponse)(res, supplier, constants_1.SUCCESS_MESSAGES.SUPPLIER_UPDATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * DELETE /api/suppliers/:id
 * Delete supplier
 */
router.delete('/:id', async (req, res) => {
    try {
        await supplier_service_1.supplierService.deleteSupplier(req.params.id);
        return (0, response_1.successResponse)(res, null, constants_1.SUCCESS_MESSAGES.SUPPLIER_DELETED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map