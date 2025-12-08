import { Router, Request, Response } from 'express';
import { drugService } from '../services/drug.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { CreateDrugRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/drugs
 * Get all drugs with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const result = await drugService.getAllDrugs(Number(page), Number(limit), search as string);
    return paginatedResponse(res, result.drugs, result.pagination, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/drugs/categories
 * Get drug categories
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await drugService.getCategories();
    return successResponse(res, categories, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/drugs/low-stock
 * Get low stock drugs
 */
router.get('/low-stock', async (_req: Request, res: Response) => {
  try {
    const drugs = await drugService.getLowStockDrugs();
    return successResponse(res, drugs, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/drugs/:id
 * Get drug by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const drug = await drugService.getDrugById(req.params.id);
    return successResponse(res, drug, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === ERROR_MESSAGES.DRUG_NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/drugs
 * Create new drug
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateDrugRequest = req.body;
    const drug = await drugService.createDrug(data);
    return successResponse(res, drug, SUCCESS_MESSAGES.DRUG_CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PUT /api/drugs/:id
 * Update drug
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const drug = await drugService.updateDrug(req.params.id, req.body);
    return successResponse(res, drug, SUCCESS_MESSAGES.DRUG_UPDATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/drugs/:id
 * Delete drug
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await drugService.deleteDrug(req.params.id);
    return successResponse(res, null, SUCCESS_MESSAGES.DRUG_DELETED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
