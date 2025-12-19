import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import {
  CreateShelfLocationRequest,
  UpdateShelfLocationRequest,
  ShelfLocationWithBatches,
  QueuedBatch,
  PickValidationResult,
  CreateExpiryActionRequest,
  InventoryBatch,
  Drug,
  IncorrectPickAlert,
} from '../types';

export class SmartShelfService {
  // ==================== SHELF LOCATION CRUD ====================

  /**
   * Get all shelf locations with optional filtering
   */
  async getAllShelves(
    page: number = 1,
    limit: number = 20,
    status?: string,
    zone?: string,
    search?: string
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (zone) where.zone = zone;
    if (search) {
      where.OR = [
        { shelfCode: { contains: search, mode: 'insensitive' } },
        { shelfName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shelves, total] = await Promise.all([
      prisma.shelfLocation.findMany({
        where,
        skip,
        take: limit,
        include: {
          batches: {
            include: {
              drug: true,
              supplier: true,
            },
          },
        },
        orderBy: { shelfCode: 'asc' },
      }),
      prisma.shelfLocation.count({ where }),
    ]);

    // Enrich shelves with currentStock and utilization data
    const enrichedShelves = shelves.map((shelf) => {
      const currentStock = shelf.batches.length;
      const utilizationPercentage = (currentStock / shelf.capacity) * 100;

      // Enrich batches with expiry info
      const enrichedBatches = shelf.batches.map((batch) => {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiryDate);
        const expiryStatus = this.getExpiryStatus(daysUntilExpiry);
        return {
          ...batch,
          daysUntilExpiry,
          expiryStatus,
        };
      });

      return {
        ...shelf,
        batches: enrichedBatches,
        currentStock,
        utilizationPercentage,
      };
    });

    return {
      data: enrichedShelves,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get shelf by ID with batches
   */
  async getShelfById(id: string): Promise<ShelfLocationWithBatches | null> {
    const shelf = await prisma.shelfLocation.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            drug: true,
            supplier: true,
          },
          orderBy: [
            { slotPosition: 'asc' }, // By slot position first
            { expiryDate: 'asc' }, // Then by expiry (FEFO)
          ],
        },
      },
    });

    if (!shelf) return null;

    // Enrich batch data with expiry calculations and status
    const enrichedBatches = shelf.batches.map((batch) => {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiryDate);
      const expiryStatus = this.getExpiryStatus(daysUntilExpiry);
      return {
        ...batch,
        daysUntilExpiry,
        expiryStatus,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      };
    });

    // Calculate current stock as number of filled slots (not total quantity)
    const currentStock = shelf.batches.length;
    const utilizationPercentage = (currentStock / shelf.capacity) * 100;

    const result: ShelfLocationWithBatches = {
      ...(shelf as unknown as ShelfLocationWithBatches),
      batches: enrichedBatches as unknown as ShelfLocationWithBatches['batches'],
      currentStock,
      utilizationPercentage,
    };

    return result;
  }

  /**
   * Create new shelf location
   */
  async createShelf(data: CreateShelfLocationRequest) {
    try {
      return await prisma.shelfLocation.create({
        data: {
          shelfCode: data.shelfCode,
          shelfName: data.shelfName,
          row: data.row,
          column: data.column,
          zone: data.zone,
          capacity: data.capacity || 50,
          status: data.status || 'ACTIVE',
          qrCode: data.qrCode,
          notes: data.notes,
        },
      });
    } catch (error: unknown) {
      // Handle unique constraint violations with user-friendly messages
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const field = (error.meta as { target?: string[] } | undefined)?.target?.[0];
        if (field === 'shelf_code') {
          throw new Error(
            `Shelf code "${data.shelfCode}" already exists. Please use a different code.`
          );
        } else if (field === 'qr_code') {
          throw new Error(
            `QR code "${data.qrCode}" already exists. Please use a different QR code.`
          );
        }
        throw new Error('A shelf with this information already exists.');
      }
      throw error;
    }
  }

  /**
   * Update shelf location
   */
  async updateShelf(id: string, data: UpdateShelfLocationRequest) {
    return await prisma.shelfLocation.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete shelf location (only if no batches)
   */
  async deleteShelf(id: string, force: boolean = false) {
    const batchCount = await prisma.inventoryBatch.count({
      where: { shelfLocationId: id },
    });

    if (batchCount > 0 && !force) {
      throw new Error(
        `Cannot delete shelf with ${batchCount} batches. Move or remove batches first, or use force delete.`
      );
    }

    // If force delete, remove all batches from this shelf first
    if (batchCount > 0 && force) {
      await prisma.inventoryBatch.deleteMany({
        where: { shelfLocationId: id },
      });
    }

    return await prisma.shelfLocation.delete({
      where: { id },
    });
  }

  // ==================== VIRTUAL QUEUE (DEQUE) OPERATIONS ====================

  /**
   * Add batch to back of shelf queue (when new stock arrives)
   */
  async addBatchToShelf(batchId: string, shelfLocationId: string) {
    // Get current max position on this shelf
    const maxPosition = await prisma.inventoryBatch.aggregate({
      where: { shelfLocationId },
      _max: { queuePosition: true },
    });

    const newPosition = (maxPosition._max.queuePosition ?? -1) + 1;

    return await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: {
        shelfLocationId,
        queuePosition: newPosition,
      },
    });
  }

  /**
   * Remove batch from front of queue (when sold)
   */
  async removeBatchFromFront(shelfLocationId: string) {
    const frontBatch = await prisma.inventoryBatch.findFirst({
      where: { shelfLocationId, queuePosition: 0 },
      include: { drug: true },
    });

    if (!frontBatch) {
      throw new Error('No batch at front of queue');
    }

    // Remove from shelf and reorder queue
    await prisma.inventoryBatch.update({
      where: { id: frontBatch.id },
      data: { shelfLocationId: null, queuePosition: null },
    });

    await this.reorderQueue(shelfLocationId);

    return frontBatch;
  }

  /**
   * Get virtual queue for a shelf (ordered by position)
   */
  async getShelfQueue(shelfLocationId: string): Promise<QueuedBatch[]> {
    const batches = await prisma.inventoryBatch.findMany({
      where: { shelfLocationId },
      include: { drug: true },
      orderBy: [{ queuePosition: 'asc' }, { expiryDate: 'asc' }],
    });

    return batches.map((batch, index) => ({
      batch: batch as unknown as QueuedBatch['batch'],
      position: batch.queuePosition ?? index,
      isAtFront: batch.queuePosition === 0,
    }));
  }

  /**
   * Reorder queue positions after removal
   */
  private async reorderQueue(shelfLocationId: string) {
    const batches = await prisma.inventoryBatch.findMany({
      where: { shelfLocationId },
      orderBy: [{ queuePosition: 'asc' }, { expiryDate: 'asc' }],
    });

    const updates = batches.map((batch, index) =>
      prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: { queuePosition: index },
      })
    );

    await Promise.all(updates);
  }

  // ==================== FEFO VALIDATION & INCORRECT PICK ALERTS ====================

  /**
   * Validate if picked batch is correct (FEFO enforcement)
   */
  async validateBatchPick(
    shelfLocationId: string,
    pickedBatchId: string,
    userId?: string
  ): Promise<PickValidationResult> {
    // Get expected batch (front of queue)
    const expectedBatch = await prisma.inventoryBatch.findFirst({
      where: { shelfLocationId, queuePosition: 0 },
      include: { drug: true },
    });

    // Get picked batch
    const pickedBatch = await prisma.inventoryBatch.findUnique({
      where: { id: pickedBatchId },
      include: { drug: true },
    });

    if (!expectedBatch || !pickedBatch) {
      return {
        isValid: false,
        message: 'Batch not found',
      };
    }

    // Check if picked batch matches expected batch
    if (pickedBatch.id === expectedBatch.id) {
      return {
        isValid: true,
        expectedBatch: expectedBatch as unknown as InventoryBatch & { drug: Drug },
        pickedBatch: pickedBatch as unknown as InventoryBatch & { drug: Drug },
        message: 'Correct batch picked (FEFO compliant)',
      };
    }

    // Incorrect pick - create alert
    const alert = await prisma.incorrectPickAlert.create({
      data: {
        shelfLocationId,
        batchIdPicked: pickedBatchId,
        batchIdExpected: expectedBatch.id,
        pickedBy: userId,
      },
    });

    return {
      isValid: false,
      expectedBatch: expectedBatch as unknown as InventoryBatch & { drug: Drug },
      pickedBatch: pickedBatch as unknown as InventoryBatch & { drug: Drug },
      message: `Incorrect pick! Expected batch "${expectedBatch.batchNumber}" (expires ${this.formatDate(expectedBatch.expiryDate)}), but you picked "${pickedBatch.batchNumber}" (expires ${this.formatDate(pickedBatch.expiryDate)})`,
      alert: alert as unknown as IncorrectPickAlert,
    };
  }

  /**
   * Get all unacknowledged pick alerts
   */
  async getUnacknowledgedAlerts(limit: number = 50) {
    return await prisma.incorrectPickAlert.findMany({
      where: { acknowledged: false },
      include: {
        shelfLocation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Acknowledge pick alert
   */
  async acknowledgeAlert(alertId: string) {
    return await prisma.incorrectPickAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  async getExpiringBatches(days: number = 30, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + days);

    // Also include items expired within last 30 days
    const expiredThreshold = new Date();
    expiredThreshold.setDate(expiredThreshold.getDate() - 30);

    // Get batch IDs that already have a DISCOUNT action (already processed)
    const discountedBatches = await prisma.expiryAction_Record.findMany({
      where: {
        action: 'DISCOUNT',
      },
      select: {
        batchId: true,
      },
    });
    const discountedBatchIds = discountedBatches.map((b) => b.batchId);

    const [batches, total] = await Promise.all([
      prisma.inventoryBatch.findMany({
        where: {
          expiryDate: {
            lte: expiryThreshold,
            gte: expiredThreshold, // Include recently expired (up to 30 days ago)
          },
          quantity: { gt: 0 },
          shelfLocationId: { not: null }, // Only show batches that are on a shelf
          // Exclude batches that already have a discount applied
          id: {
            notIn: discountedBatchIds.length > 0 ? discountedBatchIds : undefined,
          },
        },
        include: {
          drug: true,
          supplier: true,
          shelfLocation: true,
        },
        orderBy: { expiryDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.inventoryBatch.count({
        where: {
          expiryDate: {
            lte: expiryThreshold,
            gte: expiredThreshold,
          },
          quantity: { gt: 0 },
          shelfLocationId: { not: null }, // Only count batches that are on a shelf
          // Exclude batches that already have a discount applied
          id: {
            notIn: discountedBatchIds.length > 0 ? discountedBatchIds : undefined,
          },
        },
      }),
    ]);

    const enrichedBatches = batches.map((batch) => {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiryDate);
      const expiryStatus = this.getExpiryStatus(daysUntilExpiry);
      return {
        ...batch,
        daysUntilExpiry,
        expiryStatus,
      };
    });

    return {
      data: enrichedBatches,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Record expiry action (swipe decision)
   */
  async recordExpiryAction(data: CreateExpiryActionRequest, userId?: string) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: data.batchId },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (data.quantity > batch.quantity) {
      throw new Error(`Cannot process ${data.quantity} items. Only ${batch.quantity} available.`);
    }

    // Create action record
    const actionRecord = await prisma.expiryAction_Record.create({
      data: {
        batchId: data.batchId,
        action: data.action,
        performedBy: userId,
        quantity: data.quantity,
        reason: data.reason,
        vendorReturn: data.vendorReturn ?? false,
        discountAmount: data.discountAmount,
        notes: data.notes,
      },
    });

    // For DISCOUNT action, keep items on shelf - don't reduce quantity
    // Only reduce quantity for RETURN_TO_VENDOR and DISPOSE actions
    if (data.action !== 'DISCOUNT') {
      // Update batch quantity
      const newQuantity = batch.quantity - data.quantity;
      await prisma.inventoryBatch.update({
        where: { id: data.batchId },
        data: { quantity: newQuantity },
      });

      // If quantity reaches 0, remove from shelf
      if (newQuantity === 0 && batch.shelfLocationId) {
        await prisma.inventoryBatch.update({
          where: { id: data.batchId },
          data: { shelfLocationId: null, queuePosition: null },
        });
        await this.reorderQueue(batch.shelfLocationId);
      }
    }
    // For DISCOUNT action, items stay on shelf with same quantity
    // The discount is recorded in the action record for reference

    return actionRecord;
  }

  /**
   * Get expiry action history
   */
  async getExpiryActionHistory(batchId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = batchId ? { batchId } : {};

    const [actions, total] = await Promise.all([
      prisma.expiryAction_Record.findMany({
        where,
        include: {
          batch: {
            include: {
              drug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expiryAction_Record.count({ where }),
    ]);

    return {
      data: actions,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // ==================== ANALYTICS & DASHBOARD ====================

  /**
   * Get smart shelf dashboard statistics
   */
  async getShelfAnalytics() {
    const [
      totalShelves,
      activeShelves,
      totalBatchesOnShelf,
      expiringCount,
      incorrectPickCount,
      topUtilizedShelves,
    ] = await Promise.all([
      prisma.shelfLocation.count(),
      prisma.shelfLocation.count({ where: { status: 'ACTIVE' } }),
      prisma.inventoryBatch.count({ where: { shelfLocationId: { not: null } } }),
      prisma.inventoryBatch.count({
        where: {
          shelfLocationId: { not: null },
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      prisma.incorrectPickAlert.count({ where: { acknowledged: false } }),
      prisma.shelfLocation.findMany({
        include: {
          batches: true,
        },
        take: 5,
      }),
    ]);

    const utilization = topUtilizedShelves
      .map((shelf) => {
        const stock = shelf.batches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          shelfCode: shelf.shelfCode,
          shelfName: shelf.shelfName,
          currentStock: stock,
          capacity: shelf.capacity,
          utilizationPercentage: (stock / shelf.capacity) * 100,
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    return {
      totalShelves,
      activeShelves,
      totalBatchesOnShelf,
      expiringCount,
      incorrectPickCount,
      topUtilizedShelves: utilization,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get expiry status based on days until expiry
   */
  private getExpiryStatus(daysUntilExpiry: number): string {
    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 7) {
      return 'urgent';
    } else if (daysUntilExpiry <= 14) {
      return 'critical';
    } else if (daysUntilExpiry <= 30) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export const smartShelfService = new SmartShelfService();
