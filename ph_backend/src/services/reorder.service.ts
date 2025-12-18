import prisma from '../config/database';
import { calculatePagination } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';
import { supplierEmailService } from './supplier-email.service';
import { webSearchService } from './web-search.service';
import logger from '../config/logger';

interface CreateReorderRequest {
  drugId: string;
  requestedQty: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  supplierId?: string;
  estimatedCost?: number;
}

interface SendSupplierEmailRequest {
  reorderId: string;
  userId: string;
  quantity: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
}

interface UpdateReorderRequest {
  status?: 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'REJECTED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  supplierId?: string;
  estimatedCost?: number;
}

export class ReorderService {
  /**
   * Create a new reorder request
   */
  async createReorder(userId: string, data: CreateReorderRequest) {
    // Get drug and current stock information
    const drug = await prisma.drug.findUnique({
      where: { id: data.drugId },
      include: {
        inventoryBatches: true,
      },
    });

    if (!drug) {
      throw new Error(ERROR_MESSAGES.DRUG_NOT_FOUND);
    }

    // Calculate current total stock
    const currentStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);

    // Determine priority based on stock levels if not provided
    let priority = data.priority || 'MEDIUM';
    if (!data.priority) {
      const stockPercentage = (currentStock / drug.reorderLevel) * 100;
      if (stockPercentage <= 10) {
        priority = 'HIGH';
      } else if (stockPercentage <= 25) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }
    }

    const reorder = await prisma.reorderRequest.create({
      data: {
        drugId: data.drugId,
        requestedBy: userId,
        requestedQty: data.requestedQty,
        currentStock,
        reorderLevel: drug.reorderLevel,
        priority,
        notes: data.notes,
        supplierId: data.supplierId,
        estimatedCost: data.estimatedCost,
      },
      include: {
        drug: true,
        requestedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        supplier: true,
      },
    });

    return reorder;
  }

  /**
   * Get all reorder requests with pagination and filters
   */
  async getAllReorders(page: number = 1, limit: number = 10, status?: string, priority?: string) {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const total = await prisma.reorderRequest.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const reorders = await prisma.reorderRequest.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        drug: true,
        requestedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        supplier: true,
      },
    });

    return { reorders, pagination };
  }

  /**
   * Get reorder by ID
   */
  async getReorderById(id: string) {
    const reorder = await prisma.reorderRequest.findUnique({
      where: { id },
      include: {
        drug: {
          include: {
            inventoryBatches: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        supplier: true,
      },
    });

    if (!reorder) {
      throw new Error('Reorder request not found');
    }

    return reorder;
  }

  /**
   * Update reorder request
   */
  async updateReorder(id: string, userId: string, data: UpdateReorderRequest) {
    const existingReorder = await prisma.reorderRequest.findUnique({
      where: { id },
    });

    if (!existingReorder) {
      throw new Error('Reorder request not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;

      // Set timestamps based on status
      if (data.status === 'APPROVED') {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      } else if (data.status === 'ORDERED') {
        updateData.orderedAt = new Date();
      } else if (data.status === 'RECEIVED') {
        updateData.receivedAt = new Date();
      }
    }

    if (data.priority) {
      updateData.priority = data.priority;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.supplierId !== undefined) {
      updateData.supplierId = data.supplierId;
    }

    if (data.estimatedCost !== undefined) {
      updateData.estimatedCost = data.estimatedCost;
    }

    const reorder = await prisma.reorderRequest.update({
      where: { id },
      data: updateData,
      include: {
        drug: true,
        requestedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        supplier: true,
      },
    });

    return reorder;
  }

  /**
   * Delete reorder request
   */
  async deleteReorder(id: string) {
    const reorder = await prisma.reorderRequest.findUnique({
      where: { id },
    });

    if (!reorder) {
      throw new Error('Reorder request not found');
    }

    await prisma.reorderRequest.delete({
      where: { id },
    });

    return { message: 'Reorder request deleted successfully' };
  }

  /**
   * Get reorder statistics
   */
  async getReorderStats() {
    const total = await prisma.reorderRequest.count();
    const pending = await prisma.reorderRequest.count({
      where: { status: 'PENDING' },
    });
    const approved = await prisma.reorderRequest.count({
      where: { status: 'APPROVED' },
    });
    const ordered = await prisma.reorderRequest.count({
      where: { status: 'ORDERED' },
    });
    const highPriority = await prisma.reorderRequest.count({
      where: { priority: 'HIGH', status: { not: 'RECEIVED' } },
    });

    return {
      total,
      pending,
      approved,
      ordered,
      highPriority,
    };
  }

  /**
   * Get drugs that need reordering (low stock)
   */
  async getDrugsNeedingReorder() {
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: true,
        reorderRequests: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED', 'ORDERED'],
            },
          },
        },
      },
    });

    const drugsNeedingReorder = drugs
      .map((drug) => {
        const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        const stockPercentage = (totalStock / drug.reorderLevel) * 100;
        const hasActiveReorder = drug.reorderRequests.length > 0;

        return {
          ...drug,
          totalStock,
          stockPercentage: Math.round(stockPercentage),
          hasActiveReorder,
          needsReorder: totalStock <= drug.reorderLevel,
        };
      })
      .filter((drug) => drug.needsReorder)
      .sort((a, b) => a.stockPercentage - b.stockPercentage);

    return drugsNeedingReorder;
  }

  /**
   * Get previous suppliers for a drug
   */
  async getPreviousSuppliers(drugId: string) {
    try {
      // Get suppliers from previous inventory batches
      const batches = await prisma.inventoryBatch.findMany({
        where: {
          drugId,
          supplierId: { not: null },
        },
        include: {
          supplier: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Get unique suppliers with purchase history
      const supplierMap = new Map();

      batches.forEach((batch) => {
        if (batch.supplier && !supplierMap.has(batch.supplierId)) {
          supplierMap.set(batch.supplierId, {
            id: batch.supplier.id,
            name: batch.supplier.supplierName,
            email: batch.supplier.email,
            contactNumber: batch.supplier.contactNumber,
            address: batch.supplier.address,
            lastPurchaseDate: batch.createdAt,
            lastPurchasePrice: batch.purchasePrice,
            totalPurchases: 1,
          });
        } else if (batch.supplier) {
          const existing = supplierMap.get(batch.supplierId);
          existing.totalPurchases += 1;
        }
      });

      return Array.from(supplierMap.values());
    } catch (error) {
      logger.error('Error getting previous suppliers:', error);
      throw new Error('Failed to get previous suppliers');
    }
  }

  /**
   * Search for public suppliers
   */
  async searchPublicSuppliers(drugId: string) {
    try {
      const drug = await prisma.drug.findUnique({
        where: { id: drugId },
      });

      if (!drug) {
        throw new Error(ERROR_MESSAGES.DRUG_NOT_FOUND);
      }

      const searchResults = await webSearchService.searchMedicineSuppliers(
        drug.brandName,
        drug.genericName
      );

      return searchResults;
    } catch (error) {
      logger.error('Error searching public suppliers:', error);
      throw new Error('Failed to search public suppliers');
    }
  }

  /**
   * Send email to supplier for reorder
   */
  async sendSupplierEmail(data: SendSupplierEmailRequest) {
    try {
      const reorder = await prisma.reorderRequest.findUnique({
        where: { id: data.reorderId },
        include: {
          drug: true,
          supplier: true,
        },
      });

      if (!reorder) {
        throw new Error('Reorder request not found');
      }

      if (!reorder.supplier) {
        throw new Error('No supplier associated with this reorder request');
      }

      const emailResult = await supplierEmailService.sendSupplierOrderEmail({
        supplierName: reorder.supplier.supplierName,
        supplierEmail: reorder.supplier.email,
        drugName: reorder.drug.brandName,
        genericName: reorder.drug.genericName || undefined,
        quantity: data.quantity,
        urgency: reorder.priority as 'HIGH' | 'MEDIUM' | 'LOW',
        currentStock: reorder.currentStock,
        reorderLevel: reorder.reorderLevel,
        estimatedCost: reorder.estimatedCost ? Number(reorder.estimatedCost) : undefined,
        notes: reorder.notes || undefined,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      });

      // Update reorder request to mark email as sent
      if (emailResult.success) {
        await prisma.reorderRequest.update({
          where: { id: data.reorderId },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
            status: 'ORDERED',
            orderedAt: new Date(),
          },
        });
      }

      return emailResult;
    } catch (error) {
      logger.error('Error sending supplier email:', error);
      throw error;
    }
  }

  /**
   * Create reorder from public supplier
   */
  async createReorderFromPublicSupplier(
    userId: string,
    data: {
      drugId: string;
      requestedQty: number;
      supplierName: string;
      supplierEmail: string;
      supplierUrl: string;
      estimatedCost?: number;
      notes?: string;
    }
  ) {
    try {
      const drug = await prisma.drug.findUnique({
        where: { id: data.drugId },
        include: { inventoryBatches: true },
      });

      if (!drug) {
        throw new Error(ERROR_MESSAGES.DRUG_NOT_FOUND);
      }

      const currentStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);

      const reorder = await prisma.reorderRequest.create({
        data: {
          drugId: data.drugId,
          requestedBy: userId,
          requestedQty: data.requestedQty,
          currentStock,
          reorderLevel: drug.reorderLevel,
          supplierSource: 'PUBLIC',
          supplierName: data.supplierName,
          supplierEmail: data.supplierEmail,
          supplierUrl: data.supplierUrl,
          estimatedCost: data.estimatedCost,
          notes: data.notes,
          priority: currentStock <= drug.reorderLevel * 0.25 ? 'HIGH' : 'MEDIUM',
        },
        include: {
          drug: true,
          requestedByUser: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      return reorder;
    } catch (error) {
      logger.error('Error creating reorder from public supplier:', error);
      throw error;
    }
  }

  /**
   * Mark reorder as completed
   */
  async completeReorder(id: string, actualCost?: number) {
    try {
      const reorder = await prisma.reorderRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualCost: actualCost,
        },
        include: {
          drug: true,
          supplier: true,
        },
      });

      return reorder;
    } catch (error) {
      logger.error('Error completing reorder:', error);
      throw new Error('Failed to complete reorder');
    }
  }
}

export const reorderService = new ReorderService();
