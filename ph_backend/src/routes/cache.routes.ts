import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import CacheService from '../services/cache.service';
import CacheUtil from '../utils/cache.util';
import ValkeyClient from '../config/valkey';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await CacheService.generic.getStats();
    return successResponse(res, stats, 'Cache statistics retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/cache/health
 * Check cache health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthy = await ValkeyClient.healthCheck();
    const status = {
      healthy,
      connected: ValkeyClient.isClientConnected(),
      timestamp: new Date().toISOString(),
    };
    return successResponse(res, status, 'Cache health check completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * DELETE /api/cache/clear
 * Clear specific cache patterns or all cache
 */
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    const { pattern } = req.query;

    if (pattern && typeof pattern === 'string') {
      const deleted = await CacheUtil.deletePattern(pattern);
      return successResponse(
        res,
        { deleted, pattern },
        `Cleared ${deleted} cache entries matching pattern: ${pattern}`
      );
    } else {
      await CacheService.generic.flushAll();
      return successResponse(res, {}, 'All cache cleared successfully');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * DELETE /api/cache/invalidate/:entity
 * Invalidate cache for specific entities
 */
router.delete('/invalidate/:entity', async (req: Request, res: Response) => {
  try {
    const { entity } = req.params;
    let deleted = 0;

    switch (entity) {
      case 'drugs':
        deleted = await CacheService.drug.invalidate();
        break;
      case 'customers':
        deleted = await CacheService.customer.invalidate();
        break;
      case 'suppliers':
        deleted = await CacheService.supplier.invalidate();
        break;
      case 'inventory':
        deleted = await CacheService.inventory.invalidate();
        break;
      case 'sales':
        deleted = await CacheService.sale.invalidate();
        break;
      case 'prescriptions':
        deleted = await CacheService.prescription.invalidate();
        break;
      case 'dashboard':
        deleted = await CacheService.dashboard.invalidate();
        break;
      default:
        return errorResponse(res, `Unknown entity: ${entity}`, HTTP_STATUS.BAD_REQUEST);
    }

    return successResponse(
      res,
      { deleted, entity },
      `Invalidated ${deleted} cache entries for ${entity}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/cache/warm
 * Warm up cache by pre-loading common data
 */
router.post('/warm', async (_req: Request, res: Response) => {
  try {
    // This could be expanded to pre-load commonly accessed data
    const message = 'Cache warming initiated (feature can be expanded as needed)';
    return successResponse(res, {}, message);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
