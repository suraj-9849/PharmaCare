import * as cron from 'node-cron';
import prisma from '../config/database';
import { emailService } from './email.service';
import logger from '../config/logger';

interface ExpiringDrug {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  sku: string;
  batchNumber: string;
  expiryDate: Date;
  currentStock: number;
  daysUntilExpiry: number;
}

class ExpiryCheckService {
  private cronJob: cron.ScheduledTask | null = null;
  startDailyExpiryCheck() {
    this.cronJob = cron.schedule('0 * * * *', async () => {
      logger.info('Running daily expiry check...');
      await this.checkExpiringDrugs();
    });

    this.checkExpiringDrugs();
  }

  /**
   * Stop the cron job
   */
  stopDailyExpiryCheck() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Expiry check cron job stopped');
    }
  }

  /**
   * Check for drugs expiring within 30 days
   */
  async checkExpiringDrugs(): Promise<void> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Find all inventory items expiring within 30 days with stock > 0
      const expiringInventory = await prisma.inventoryBatch.findMany({
        where: {
          expiryDate: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
          quantity: {
            gt: 0,
          },
        },
        include: {
          drug: {
            select: {
              id: true,
              brandName: true,
              genericName: true,
              category: true,
              sku: true,
            },
          },
        },
        orderBy: {
          expiryDate: 'asc',
        },
      });

      if (expiringInventory.length === 0) {
        logger.info('No drugs expiring within 30 days');
        return;
      }

      logger.info(`Found ${expiringInventory.length} drugs expiring within 30 days`);

      // Transform data for email
      const expiringDrugs: ExpiringDrug[] = expiringInventory.map((inv: any) => {
        const daysUntilExpiry = Math.ceil(
          (inv.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: inv.id,
          brandName: inv.drug.brandName,
          genericName: inv.drug.genericName || '',
          category: inv.drug.category,
          sku: inv.drug.sku,
          batchNumber: inv.batchNumber,
          expiryDate: inv.expiryDate,
          currentStock: inv.quantity,
          daysUntilExpiry,
        };
      });

      // Send email notification
      await emailService.sendExpiryAlert(expiringDrugs);

      logger.info('Expiry alert email sent successfully');
    } catch (error) {
      logger.error('Error in checkExpiringDrugs:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing (can be called from API endpoint)
   */
  async triggerManualCheck(): Promise<ExpiringDrug[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringInventory = await prisma.inventoryBatch.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        quantity: {
          gt: 0,
        },
      },
      include: {
        drug: {
          select: {
            id: true,
            brandName: true,
            genericName: true,
            category: true,
            sku: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return expiringInventory.map((inv: any) => {
      const daysUntilExpiry = Math.ceil(
        (inv.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: inv.id,
        brandName: inv.drug.brandName,
        genericName: inv.drug.genericName || '',
        category: inv.drug.category,
        sku: inv.drug.sku,
        batchNumber: inv.batchNumber,
        expiryDate: inv.expiryDate,
        currentStock: inv.quantity,
        daysUntilExpiry,
      };
    });
  }
}

export const expiryCheckService = new ExpiryCheckService();
