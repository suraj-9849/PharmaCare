import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { CreateBatchRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/inventory
 * Get all inventory batches with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, drugId } = req.query;
    const result = await inventoryService.getAllBatches(
      Number(page),
      Number(limit),
      drugId as string
    );
    return paginatedResponse(
      res,
      result.batches,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/summary
 * Get stock summary
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await inventoryService.getStockSummary();
    return successResponse(res, summary, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/expiring
 * Get expiring batches
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const batches = await inventoryService.getExpiringBatches(Number(days));
    return successResponse(res, batches, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/expired
 * Get expired batches
 */
router.get('/expired', async (_req: Request, res: Response) => {
  try {
    const batches = await inventoryService.getExpiredBatches();
    return successResponse(res, batches, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/available
 * Get all available batches for sale
 */
router.get('/available', async (_req: Request, res: Response) => {
  try {
    const batches = await inventoryService.getAllAvailableBatches();
    return successResponse(res, batches, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/drug/:drugId/available
 * Get available batches for a drug (for sale)
 */
router.get('/drug/:drugId/available', async (req: Request, res: Response) => {
  try {
    const batches = await inventoryService.getAvailableBatches(req.params.drugId);
    return successResponse(res, batches, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/inventory/:id
 * Get batch by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const batch = await inventoryService.getBatchById(req.params.id);
    return successResponse(res, batch, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === ERROR_MESSAGES.BATCH_NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/inventory
 * Create new batch (stock in)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateBatchRequest = req.body;
    const batch = await inventoryService.createBatch(data);
    return successResponse(res, batch, SUCCESS_MESSAGES.BATCH_ADDED, HTTP_STATUS.CREATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PUT /api/inventory/:id
 * Update batch
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const batch = await inventoryService.updateBatch(req.params.id, req.body);
    return successResponse(res, batch, SUCCESS_MESSAGES.BATCH_UPDATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete batch
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await inventoryService.deleteBatch(req.params.id);
    return successResponse(res, null, 'Batch deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
