"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_service_1 = require("../services/customer.service");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /api/customers
 * Get all customers with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const result = await customer_service_1.customerService.getAllCustomers(Number(page), Number(limit), search);
        return (0, response_1.paginatedResponse)(res, result.customers, result.pagination, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/customers/search
 * Search customers
 */
router.get('/search', async (req, res) => {
    try {
        const { q = '' } = req.query;
        const customers = await customer_service_1.customerService.searchCustomers(q);
        return (0, response_1.successResponse)(res, customers, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});
/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const customer = await customer_service_1.customerService.getCustomerById(req.params.id);
        return (0, response_1.successResponse)(res, customer, constants_1.SUCCESS_MESSAGES.FETCH_SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        const statusCode = message === constants_1.ERROR_MESSAGES.CUSTOMER_NOT_FOUND
            ? constants_1.HTTP_STATUS.NOT_FOUND
            : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return (0, response_1.errorResponse)(res, message, statusCode);
    }
});
/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const customer = await customer_service_1.customerService.createCustomer(data);
        return (0, response_1.successResponse)(res, customer, constants_1.SUCCESS_MESSAGES.CUSTOMER_CREATED, constants_1.HTTP_STATUS.CREATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', async (req, res) => {
    try {
        const customer = await customer_service_1.customerService.updateCustomer(req.params.id, req.body);
        return (0, response_1.successResponse)(res, customer, constants_1.SUCCESS_MESSAGES.CUSTOMER_UPDATED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
/**
 * DELETE /api/customers/:id
 * Delete customer
 */
router.delete('/:id', async (req, res) => {
    try {
        await customer_service_1.customerService.deleteCustomer(req.params.id);
        return (0, response_1.successResponse)(res, null, constants_1.SUCCESS_MESSAGES.CUSTOMER_DELETED);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
        return (0, response_1.errorResponse)(res, message, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
});
exports.default = router;
//# sourceMappingURL=customer.routes.js.map