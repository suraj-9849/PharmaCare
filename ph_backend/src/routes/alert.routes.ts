import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { emailService } from '../services/email.service';
import prisma from '../config/database';

const router: Router = Router();

/**
 * POST /api/alerts/test-low-stock
 * Test low stock email alert
 */
router.post('/test-low-stock', authenticate, async (_req: Request, res: Response) => {
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
router.post('/test-out-of-stock', authenticate, async (_req: Request, res: Response) => {
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
