import { Router, Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { CreateSupplierRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/suppliers
 * Get all suppliers with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const result = await supplierService.getAllSuppliers(
      Number(page),
      Number(limit),
      search as string
    );
    return paginatedResponse(
      res,
      result.suppliers,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/suppliers/simple
 * Get all suppliers (for dropdown)
 */
router.get('/simple', async (_req: Request, res: Response) => {
  try {
    const suppliers = await supplierService.getAllSuppliersSimple();
    return successResponse(res, suppliers, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/suppliers/:id
 * Get supplier by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return successResponse(res, supplier, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === ERROR_MESSAGES.SUPPLIER_NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/suppliers
 * Create new supplier
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateSupplierRequest = req.body;
    const supplier = await supplierService.createSupplier(data);
    return successResponse(res, supplier, SUCCESS_MESSAGES.SUPPLIER_CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PUT /api/suppliers/:id
 * Update supplier
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return successResponse(res, supplier, SUCCESS_MESSAGES.SUPPLIER_UPDATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/suppliers/:id
 * Delete supplier
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    return successResponse(res, null, SUCCESS_MESSAGES.SUPPLIER_DELETED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
