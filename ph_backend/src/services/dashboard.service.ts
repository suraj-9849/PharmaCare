import prisma from '../config/database';
import { getStartOfToday, getEndOfToday, isExpiringSoon, isExpired } from '../utils/helpers';
import { Sale, InventoryBatch, Drug } from '@prisma/client';
import CacheService from './cache.service';
export class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    // Try to get from cache
    const cached = await CacheService.dashboard.getStats();
    if (cached) return cached;

    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    // Today's sales
    const todaySales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'COMPLETED',
      },
    });

    const todaySalesCount = todaySales.length;
    const todayRevenue = todaySales.reduce(
      (sum: number, sale: Sale) => sum + Number(sale.totalAmount),
      0
    );

    // Total products
    const totalProducts = await prisma.drug.count();

    // Total sales (all time)
    const totalSalesCount = await prisma.sale.count({
      where: { status: 'COMPLETED' },
    });

    const allSales = await prisma.sale.findMany({
      where: { status: 'COMPLETED' },
    });

    const totalRevenue = allSales.reduce(
      (sum: number, sale: Sale) => sum + Number(sale.totalAmount),
      0
    );

    // Stock alerts
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: {
          where: { quantity: { gt: 0 } },
        },
      },
    });

    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    for (const drug of drugs) {
      const totalStock = drug.inventoryBatches.reduce(
        (sum: number, batch: InventoryBatch) => sum + batch.quantity,
        0
      );

      if (totalStock <= drug.reorderLevel) {
        lowStockCount++;
      }

      for (const batch of drug.inventoryBatches) {
        if (isExpired(batch.expiryDate)) {
          expiredCount++;
        } else if (isExpiringSoon(batch.expiryDate)) {
          expiringCount++;
        }
      }
    }

    // Recent sales
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { saleDate: 'desc' },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        saleItems: {
          include: {
            drug: {
              select: {
                brandName: true,
              },
            },
          },
        },
      },
    });

    // Stock alerts
    const stockAlerts = await prisma.stockAlert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { isRead: false },
    });

    // Cancellations today
    const todayCancellations = await prisma.sale.count({
      where: {
        saleDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'CANCELLED',
      },
    });

    // Total suppliers
    const totalSuppliers = await prisma.supplier.count();

    // Total customers
    const totalCustomers = await prisma.customer.count();

    // Calculate total inventory value
    let totalInventoryValue = 0;
    const inventoryBatches = await prisma.inventoryBatch.findMany();
    for (const batch of inventoryBatches) {
      totalInventoryValue += Number(batch.sellPrice) * batch.quantity;
    }

    const result = {
      todaySales: todaySalesCount,
      todayRevenue,
      todayCancellations,
      totalDrugs: totalProducts,
      totalProducts,
      totalSales: totalSalesCount,
      totalSalesAmount: totalRevenue,
      totalRevenue,
      lowStockCount,
      expiringCount,
      expiredCount,
      totalSuppliers,
      totalCustomers,
      totalInventoryValue,
      recentSales,
      stockAlerts,
    };

    // Cache the result with short TTL since stats change frequently
    await CacheService.dashboard.setStats(result);

    return result;
  }

  /**
   * Get sales chart data
   */
  async getSalesChartData(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate },
        status: 'COMPLETED',
      },
      orderBy: { saleDate: 'asc' },
    });

    // Group by date
    const chartData: Record<string, { date: string; sales: number; revenue: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      chartData[dateStr] = { date: dateStr, sales: 0, revenue: 0 };
    }

    for (const sale of sales) {
      const dateStr = sale.saleDate.toISOString().split('T')[0];
      if (chartData[dateStr]) {
        chartData[dateStr].sales += 1;
        chartData[dateStr].revenue += Number(sale.totalAmount);
      }
    }

    return Object.values(chartData);
  }

  /**
   * Get top selling drugs
   */
  async getTopSellingDrugs(limit: number = 5) {
    const saleItems = await prisma.saleItem.groupBy({
      by: ['drugId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drugIds = saleItems.map((item: any) => item.drugId);
    const drugs = await prisma.drug.findMany({
      where: { id: { in: drugIds } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return saleItems.map((item: any) => {
      const drug = drugs.find((d: Drug) => d.id === item.drugId);
      return {
        drugId: item.drugId,
        brandName: drug?.brandName || 'Unknown',
        genericName: drug?.genericName || 'Unknown',
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.subtotal) || 0,
      };
    });
  }
}

export const dashboardService = new DashboardService();
