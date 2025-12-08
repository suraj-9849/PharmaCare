import prisma from '../config/database';
import { CreateSaleRequest } from '../types';
import { calculatePagination, getStartOfToday, getEndOfToday } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';
import { Sale, SaleItem } from '@prisma/client';

export class SaleService {
  /**
   * Create a new sale
   */
  async createSale(userId: string, data: CreateSaleRequest) {
    // Validate stock availability
    for (const item of data.items) {
      const batch = await prisma.inventoryBatch.findUnique({
        where: { id: item.batchId },
      });

      if (!batch) {
        throw new Error(`${ERROR_MESSAGES.BATCH_NOT_FOUND}: ${item.batchId}`);
      }

      if (batch.quantity < item.quantity) {
        throw new Error(`${ERROR_MESSAGES.INSUFFICIENT_STOCK} for batch ${item.batchId}`);
      }
    }

    // Calculate totals and create sale
    const sale = await prisma.$transaction(async (tx) => {
      // Get batch prices and calculate items
      const saleItems = await Promise.all(
        data.items.map(async (item) => {
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
      let changeGiven: number | null = null;
      if (data.paymentMethod === 'CASH' && data.cashReceived) {
        changeGiven = data.cashReceived - totalAmount;
      }

      // Create sale
      const newSale = await tx.sale.create({
        data: {
          userId,
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
        },
      });

      // Update inventory quantities
      for (const item of data.items) {
        await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    return sale;
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
