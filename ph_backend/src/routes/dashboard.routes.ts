import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard
 * Get dashboard statistics
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return successResponse(res, stats, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/dashboard/chart
 * Get sales chart data
 */
router.get('/chart', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const chartData = await dashboardService.getSalesChartData(Number(days));
    return successResponse(res, chartData, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/dashboard/top-selling
 * Get top selling drugs
 */
router.get('/top-selling', async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const topSelling = await dashboardService.getTopSellingDrugs(Number(limit));
    return successResponse(res, topSelling, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/dashboard/revenue-by-category
 * Get revenue breakdown by drug category
 */
router.get('/revenue-by-category', async (_req: Request, res: Response) => {
  try {
    const revenueByCategory = await dashboardService.getRevenueByCategory();
    return successResponse(res, revenueByCategory, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/dashboard/inventory-by-category
 * Get inventory stock levels by drug category
 */
router.get('/inventory-by-category', async (_req: Request, res: Response) => {
  try {
    const inventoryByCategory = await dashboardService.getInventoryByCategory();
    return successResponse(res, inventoryByCategory, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/dashboard/drug-movement
 * Get slow-moving and fast-moving drugs analysis
 */
router.get('/drug-movement', async (_req: Request, res: Response) => {
  try {
    const drugMovement = await dashboardService.getDrugMovementAnalysis();
    return successResponse(res, drugMovement, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
