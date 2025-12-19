import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { emailService } from '../services/email.service';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/alerts
 * Get all stock alerts (with optional filters)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { unreadOnly, alertType } = req.query;

    const where: any = {};

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    const alerts = await prisma.stockAlert.findMany({
      where,
      include: {
        drug: {
          select: {
            id: true,
            brandName: true,
            genericName: true,
            category: true,
            sku: true,
            reorderLevel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(res, alerts, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * PATCH /api/alerts/:id/read
 * Mark an alert as read
 */
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params;

    const alert = await prisma.stockAlert.update({
      where: { id },
      data: { isRead: true },
    });

    return successResponse(res, alert, 'Alert marked as read');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete a stock alert
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params;

    await prisma.stockAlert.delete({
      where: { id },
    });

    return successResponse(res, null, 'Alert deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/alerts/mark-all-read
 * Mark all alerts as read
 */
router.post('/mark-all-read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    await prisma.stockAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return successResponse(res, null, 'All alerts marked as read');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/alerts/test-low-stock
 * Test low stock email alert
 */
router.post('/test-low-stock', async (_req: Request, res: Response) => {
  try {
    // Get all drugs with their total stock
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: true,
      },
    });

    const lowStockDrugs = drugs
      .map((drug) => {
        const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        const stockPercentage = (totalStock / drug.reorderLevel) * 100;

        return {
          drug,
          totalStock,
          stockPercentage,
        };
      })
      .filter((d) => d.stockPercentage <= 50 && d.totalStock > 0)
      .map((d) => ({
        drugName: d.drug.genericName || d.drug.brandName,
        brandName: d.drug.brandName,
        currentStock: d.totalStock,
        reorderLevel: d.drug.reorderLevel,
        stockPercentage: Math.round(d.stockPercentage),
        category: d.drug.category || 'N/A',
        sku: d.drug.sku || 'N/A',
      }));

    if (lowStockDrugs.length > 0) {
      await emailService.sendLowStockAlert(lowStockDrugs);
      return res.json({
        success: true,
        message: `Low stock alert sent for ${lowStockDrugs.length} items`,
        data: lowStockDrugs,
      });
    }

    return res.json({
      success: true,
      message: 'No low stock items found',
      data: [],
    });
  } catch (error) {
    console.error('Test alert error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test alert',
    });
  }
});

/**
 * POST /api/alerts/test-out-of-stock
 * Test out of stock email alert
 */
router.post('/test-out-of-stock', async (_req: Request, res: Response) => {
  try {
    // Get all drugs with their total stock
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: true,
      },
    });

    const outOfStockDrugs = drugs
      .map((drug) => {
        const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);

        return {
          drug,
          totalStock,
        };
      })
      .filter((d) => d.totalStock === 0)
      .map((d) => ({
        drugName: d.drug.genericName || d.drug.brandName,
        brandName: d.drug.brandName,
        currentStock: 0,
        reorderLevel: d.drug.reorderLevel,
        stockPercentage: 0,
        category: d.drug.category || 'N/A',
        sku: d.drug.sku || 'N/A',
      }));

    if (outOfStockDrugs.length > 0) {
      await emailService.sendOutOfStockAlert(outOfStockDrugs);
      return res.json({
        success: true,
        message: `Out of stock alert sent for ${outOfStockDrugs.length} items`,
        data: outOfStockDrugs,
      });
    }

    return res.json({
      success: true,
      message: 'No out of stock items found',
      data: [],
    });
  } catch (error) {
    console.error('Test alert error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test alert',
    });
  }
});

export default router;
