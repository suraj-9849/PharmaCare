import prisma from '../config/database';
import { CreateBatchRequest } from '../types';
import { calculatePagination, isExpired, isExpiringSoon } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';
import { InventoryBatch, Drug } from '@prisma/client';

export class InventoryService {
  /**
   * Get all inventory batches with pagination
   */
  async getAllBatches(page: number = 1, limit: number = 10, drugId?: string) {
    const where = drugId ? { drugId } : {};

    const total = await prisma.inventoryBatch.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const batches = await prisma.inventoryBatch.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: { expiryDate: 'asc' },
      include: {
        drug: {
          select: {
            id: true,
            brandName: true,
            genericName: true,
            sku: true,
          },
        },
        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
      },
    });

    return { batches, pagination };
  }

  /**
   * Get batch by ID
   */
  async getBatchById(id: string) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        drug: true,
        supplier: true,
      },
    });

    if (!batch) {
      throw new Error(ERROR_MESSAGES.BATCH_NOT_FOUND);
    }

    return batch;
  }

  /**
   * Create new batch (stock in)
   */
  async createBatch(data: CreateBatchRequest) {
    const batch = await prisma.inventoryBatch.create({
      data: {
        drugId: data.drugId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        sellPrice: data.sellPrice,
        expiryDate: new Date(data.expiryDate),
        supplierId: data.supplierId || null,
        location: data.location || null,
        shelfLocationId: data.shelfLocationId || null,
        slotPosition: data.slotPosition || null,
      },
      include: {
        drug: true,
        supplier: true,
      },
    });

    // Invalidate inventory and related caches

    return batch;
  }

  /**
   * Update batch
   */
  async updateBatch(id: string, data: Partial<CreateBatchRequest>) {
    const updateData: Record<string, unknown> = {};

    // Only include fields that are provided
    if (data.drugId !== undefined) updateData.drugId = data.drugId;
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
    if (data.sellPrice !== undefined) updateData.sellPrice = data.sellPrice;
    if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.shelfLocationId !== undefined)
      updateData.shelfLocationId = data.shelfLocationId || null;
    if (data.slotPosition !== undefined) updateData.slotPosition = data.slotPosition || null;

    const batch = await prisma.inventoryBatch.update({
      where: { id },
      data: updateData,
      include: {
        drug: true,
        supplier: true,
      },
    });

    // Invalidate inventory and related caches

    return batch;
  }

  /**
   * Delete batch
   */
  async deleteBatch(id: string) {
    await prisma.inventoryBatch.delete({
      where: { id },
    });

    // Invalidate inventory and related caches
  }

  /**
   * Get expiring batches
   */
  async getExpiringBatches(days: number = 30) {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        quantity: { gt: 0 },
      },
      include: {
        drug: true,
        supplier: true,
      },
    });

    return batches.filter((batch: InventoryBatch) => isExpiringSoon(batch.expiryDate, days));
  }

  /**
   * Get expired batches
   */
  async getExpiredBatches() {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        quantity: { gt: 0 },
      },
      include: {
        drug: true,
        supplier: true,
      },
    });

    return batches.filter((batch: InventoryBatch) => isExpired(batch.expiryDate));
  }

  /**
   * Get stock summary by drug
   */
  async getStockSummary() {
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    return drugs.map((drug: Drug & { inventoryBatches: InventoryBatch[] }) => {
      const totalStock = drug.inventoryBatches.reduce(
        (sum: number, batch: InventoryBatch) => sum + batch.quantity,
        0
      );
      const expiringBatches = drug.inventoryBatches.filter((batch: InventoryBatch) =>
        isExpiringSoon(batch.expiryDate)
      );
      const expiredBatches = drug.inventoryBatches.filter((batch: InventoryBatch) =>
        isExpired(batch.expiryDate)
      );

      return {
        drugId: drug.id,
        brandName: drug.brandName,
        genericName: drug.genericName,
        totalStock,
        reorderLevel: drug.reorderLevel,
        isLowStock: totalStock <= drug.reorderLevel,
        expiringCount: expiringBatches.length,
        expiredCount: expiredBatches.length,
      };
    });
  }

  /**
   * Get available batches for a drug (for sale)
   */
  async getAvailableBatches(drugId: string) {
    const now = new Date();

    const batches = await prisma.inventoryBatch.findMany({
      where: {
        drugId,
        quantity: { gt: 0 },
        expiryDate: { gt: now },
      },
      orderBy: { expiryDate: 'asc' }, // FIFO - First Expiry First Out
      include: {
        drug: {
          select: {
            brandName: true,
            genericName: true,
          },
        },
      },
    });

    return batches;
  }

  /**
   * Get all available batches (for sales dropdown)
   */
  async getAllAvailableBatches() {
    const now = new Date();

    const batches = await prisma.inventoryBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { gt: now },
      },
      orderBy: [{ drug: { brandName: 'asc' } }, { expiryDate: 'asc' }],
      include: {
        drug: {
          select: {
            id: true,
            brandName: true,
            genericName: true,
            sku: true,
          },
        },
        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
      },
    });

    return batches;
  }
}

export const inventoryService = new InventoryService();
