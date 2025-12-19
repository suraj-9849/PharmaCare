import prisma from '../config/database';
import { CreateSaleRequest } from '../types';
import { calculatePagination, getStartOfToday, getEndOfToday } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';
import { Sale, SaleItem } from '@prisma/client';
import { emailService } from './email.service';
import { sendSaleNotification, sendLowStockNotification } from './firebase.service';

export class SaleService {
  /**
   * Create a new sale
   */
  async createSale(userId: string, data: CreateSaleRequest) {
    // Validate stock availability and separate valid/invalid items
    const validItems: typeof data.items = [];
    const outOfStockItems: Array<{
      drugId: string;
      batchId: string;
      requestedQuantity: number;
      availableQuantity: number;
      drugName: string;
    }> = [];

    for (const item of data.items) {
      const batch = await prisma.inventoryBatch.findUnique({
        where: { id: item.batchId },
        include: { drug: true },
      });

      if (!batch) {
        throw new Error(`${ERROR_MESSAGES.BATCH_NOT_FOUND}: ${item.batchId}`);
      }

      if (batch.quantity < item.quantity) {
        // Item is out of stock or insufficient - skip it and track for reorder
        outOfStockItems.push({
          drugId: item.drugId,
          batchId: item.batchId,
          requestedQuantity: item.quantity,
          availableQuantity: batch.quantity,
          drugName: batch.drug.brandName,
        });
      } else {
        // Item has sufficient stock - include it in the sale
        validItems.push(item);
      }
    }

    // If no valid items, throw error
    if (validItems.length === 0) {
      throw new Error(
        'None of the requested items are available in sufficient quantity. Please check stock levels.'
      );
    }

    // Calculate totals and create sale with valid items only
    const sale = await prisma.$transaction(async (tx) => {
      // Get batch prices and calculate items
      const saleItems = await Promise.all(
        validItems.map(async (item) => {
          const batch = await tx.inventoryBatch.findUnique({
            where: { id: item.batchId },
          });

          if (!batch) {
            throw new Error(ERROR_MESSAGES.BATCH_NOT_FOUND);
          }

          const unitPrice = Number(batch.sellPrice);
          const subtotal = unitPrice * item.quantity;

          return {
            drugId: item.drugId,
            batchId: item.batchId,
            quantity: item.quantity,
            unitPrice,
            subtotal,
          };
        })
      );

      // Calculate total
      const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);

      // Calculate change if cash payment
      const changeGiven =
        data.paymentMethod === 'CASH' && data.cashReceived
          ? data.cashReceived - totalAmount
          : (data.changeGiven ?? null);

      // Create sale
      const newSale = await tx.sale.create({
        data: {
          userId,
          customerId: data.customerId ?? null,
          totalAmount,
          paymentMethod: data.paymentMethod,
          cashReceived: data.cashReceived ?? null,
          changeGiven,
          status: 'COMPLETED',
          saleItems: {
            create: saleItems.map((item) => ({
              drugId: item.drugId,
              batchId: item.batchId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          saleItems: {
            include: {
              drug: true,
              batch: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          customer: true,
        },
      });

      // Update inventory quantities and check stock levels
      const lowStockAlerts: Array<{
        drugName: string;
        brandName: string;
        currentStock: number;
        reorderLevel: number;
        stockPercentage: number;
        category: string;
        sku: string;
      }> = [];

      const outOfStockAlerts: Array<{
        drugName: string;
        brandName: string;
        currentStock: number;
        reorderLevel: number;
        stockPercentage: number;
        category: string;
        sku: string;
      }> = [];

      for (const item of validItems) {
        // Update batch quantity
        const updatedBatch = await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
          include: {
            drug: true,
          },
        });

        // Calculate total stock for this drug across all batches
        const allBatches = await tx.inventoryBatch.findMany({
          where: { drugId: updatedBatch.drugId },
        });

        const totalStock = allBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        const drug = updatedBatch.drug;
        const stockPercentage = (totalStock / drug.reorderLevel) * 100;

        // Check for out of stock (0 stock)
        if (totalStock === 0) {
          outOfStockAlerts.push({
            drugName: drug.genericName || drug.brandName,
            brandName: drug.brandName,
            currentStock: totalStock,
            reorderLevel: drug.reorderLevel,
            stockPercentage: 0,
            category: drug.category || 'N/A',
            sku: drug.sku || 'N/A',
          });
        }
        // Check for low stock (10% or 25%)
        else if (stockPercentage <= 25) {
          lowStockAlerts.push({
            drugName: drug.genericName || drug.brandName,
            brandName: drug.brandName,
            currentStock: totalStock,
            reorderLevel: drug.reorderLevel,
            stockPercentage: Math.round(stockPercentage),
            category: drug.category || 'N/A',
            sku: drug.sku || 'N/A',
          });
        }
      }

      return { newSale, lowStockAlerts, outOfStockAlerts, skippedItems: outOfStockItems };
    });

    // Send email alerts if any (async, don't block the response)
    if (sale.outOfStockAlerts.length > 0) {
      emailService.sendOutOfStockAlert(sale.outOfStockAlerts).catch((err) => {
        console.error('Failed to send out of stock email:', err);
      });
    } else if (sale.lowStockAlerts.length > 0) {
      emailService.sendLowStockAlert(sale.lowStockAlerts).catch((err) => {
        console.error('Failed to send low stock email:', err);
      });
    }

    // Send Firebase notifications (async, don't block the response)
    // 1. Send sale completed notification
    const lowStockItemNames = sale.lowStockAlerts.map((item) => item.brandName);
    sendSaleNotification({
      saleId: sale.newSale.id,
      totalAmount: Number(sale.newSale.totalAmount),
      itemCount: sale.newSale.saleItems.length,
      lowStockItems: lowStockItemNames,
    }).catch((err) => {
      console.error('Failed to send sale notification:', err);
    });

    // 2. Send low stock notification if applicable
    if (sale.lowStockAlerts.length > 0 || sale.outOfStockAlerts.length > 0) {
      const allAlerts = [
        ...sale.lowStockAlerts.map((item) => ({
          name: item.brandName,
          quantity: item.currentStock,
        })),
        ...sale.outOfStockAlerts.map((item) => ({
          name: item.brandName,
          quantity: 0,
        })),
      ];

      sendLowStockNotification(allAlerts).catch((err) => {
        console.error('Failed to send low stock notification:', err);
      });
    }

    // Auto-create reorder requests for out-of-stock items
    if (sale.skippedItems.length > 0) {
      for (const item of sale.skippedItems) {
        // Check if a pending reorder request already exists for this drug
        const existingRequest = await prisma.reorderRequest.findFirst({
          where: {
            drugId: item.drugId,
            status: 'PENDING',
          },
        });

        // Only create if no pending request exists
        if (!existingRequest) {
          const drug = await prisma.drug.findUnique({
            where: { id: item.drugId },
          });

          if (drug) {
            await prisma.reorderRequest.create({
              data: {
                drugId: item.drugId,
                requestedBy: userId,
                requestedQty: Math.max(item.requestedQuantity, drug.reorderLevel * 2),
                currentStock: item.availableQuantity,
                reorderLevel: drug.reorderLevel,
                priority: item.availableQuantity === 0 ? 'HIGH' : 'MEDIUM',
                notes: `Auto-created from sale request. Customer requested ${item.requestedQuantity} units but only ${item.availableQuantity} available.`,
              },
            });
          }
        }
      }
    }

    return {
      sale: sale.newSale,
      skippedItems: sale.skippedItems,
    };
  }

  /**
   * Get all sales with pagination
   */
  async getAllSales(page: number = 1, limit: number = 10, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        (where.saleDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.saleDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const total = await prisma.sale.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const sales = await prisma.sale.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: { saleDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            drug: {
              select: {
                brandName: true,
                genericName: true,
              },
            },
          },
        },
      },
    });

    return { sales, pagination };
  }

  /**
   * Get sale by ID
   */
  async getSaleById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            drug: true,
            batch: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error(ERROR_MESSAGES.SALE_NOT_FOUND);
    }

    return sale;
  }

  /**
   * Cancel sale
   */
  async cancelSale(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true },
    });

    if (!sale) {
      throw new Error(ERROR_MESSAGES.SALE_NOT_FOUND);
    }

    // Restore inventory
    await prisma.$transaction(async (tx) => {
      for (const item of sale.saleItems) {
        await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    return { message: 'Sale cancelled successfully' };
  }

  /**
   * Get today's sales summary
   */
  async getTodaysSalesSummary() {
    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'COMPLETED',
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum: number, sale: Sale) => sum + Number(sale.totalAmount),
      0
    );

    return {
      totalSales,
      totalRevenue,
    };
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = getStartOfToday();
    }

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate },
        status: 'COMPLETED',
      },
      include: {
        saleItems: true,
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum: number, sale: Sale) => sum + Number(sale.totalAmount),
      0
    );
    const totalItems = sales.reduce(
      (sum: number, sale: Sale & { saleItems: SaleItem[] }) =>
        sum + sale.saleItems.reduce((s: number, item: SaleItem) => s + item.quantity, 0),
      0
    );

    return {
      period,
      totalSales,
      totalRevenue,
      totalItems,
      averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
    };
  }
}

export const saleService = new SaleService();
