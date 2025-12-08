import { Router, Request, Response } from 'express';
import { saleService } from '../services/sale.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { AuthenticatedRequest, CreateSaleRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/sales
 * Get all sales with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const result = await saleService.getAllSales(
      Number(page),
      Number(limit),
      startDate as string,
      endDate as string
    );
    return paginatedResponse(res, result.sales, result.pagination, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/sales/today
 * Get today's sales summary
 */
router.get('/today', async (_req: Request, res: Response) => {
  try {
    const summary = await saleService.getTodaysSalesSummary();
    return successResponse(res, summary, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/sales/stats
 * Get sales statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { period = 'day' } = req.query;
    const stats = await saleService.getSalesStats(period as 'day' | 'week' | 'month');
    return successResponse(res, stats, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/sales/:id
 * Get sale by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    return successResponse(res, sale, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === ERROR_MESSAGES.SALE_NOT_FOUND
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/sales
 * Create new sale
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const data: CreateSaleRequest = req.body;
    const sale = await saleService.createSale(req.user.id, data);
    return successResponse(res, sale, SUCCESS_MESSAGES.SALE_COMPLETED, HTTP_STATUS.CREATED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/sales/:id/cancel
 * Cancel sale
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const result = await saleService.cancelSale(req.params.id);
    return successResponse(res, result, SUCCESS_MESSAGES.SALE_CANCELLED);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
