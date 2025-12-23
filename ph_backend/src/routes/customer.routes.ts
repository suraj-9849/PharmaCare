import { Router, Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { CreateCustomerRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/customers
 * Get all customers with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const result = await customerService.getAllCustomers(
      Number(page),
      Number(limit),
      search as string
    );
    return paginatedResponse(
      res,
      result.customers,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/customers/search
 * Search customers
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q = '' } = req.query;
    const customers = await customerService.searchCustomers(q as string);
    return successResponse(res, customers, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return successResponse(res, customer, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === ERROR_MESSAGES.CUSTOMER_NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateCustomerRequest = req.body;
    const customer = await customerService.createCustomer(data);
    return successResponse(res, customer, SUCCESS_MESSAGES.CUSTOMER_CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return successResponse(res, customer, SUCCESS_MESSAGES.CUSTOMER_UPDATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    return successResponse(res, null, SUCCESS_MESSAGES.CUSTOMER_DELETED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
