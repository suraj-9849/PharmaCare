import prisma from '../config/database';
import { isExpiringSoon, isExpired } from '../utils/helpers';
import { Sale, InventoryBatch, Drug } from '@prisma/client';
export class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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

    return {
      todaySales: todaySalesCount,
      todaySalesCount,
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

  /**
   * Get revenue by category
   */
  async getRevenueByCategory() {
    // Get all completed sales with their items
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
        },
      },
      include: {
        drug: {
          select: {
            category: true,
          },
        },
      },
    });

    // Group by category and sum revenue
    const categoryMap: Record<string, number> = {};

    for (const item of saleItems) {
      const category = item.drug?.category || 'Uncategorized';
      const revenue = Number(item.subtotal || 0);
      categoryMap[category] = (categoryMap[category] || 0) + revenue;
    }

    // Convert to array and sort by revenue
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Get inventory levels by category
   */
  async getInventoryByCategory() {
    // Get all drugs with their inventory batches
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    // Group by category
    const categoryMap: Record<string, { stock: number; reorderLevel: number; count: number }> = {};

    for (const drug of drugs) {
      const category = drug.category || 'Uncategorized';
      const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);

      if (!categoryMap[category]) {
        categoryMap[category] = { stock: 0, reorderLevel: 0, count: 0 };
      }

      categoryMap[category].stock += totalStock;
      categoryMap[category].reorderLevel += drug.reorderLevel;
      categoryMap[category].count += 1;
    }

    // Convert to array and calculate average reorder level per category
    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        stock: data.stock,
        reorderLevel: Math.ceil(data.reorderLevel / data.count),
      }))
      .sort((a, b) => b.stock - a.stock);
  }

  /**
   * Get drug movement analysis (slow-moving and fast-moving drugs)
   */
  async getDrugMovementAnalysis() {
    // Get sales data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          saleDate: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      },
      include: {
        drug: {
          include: {
            inventoryBatches: {
              where: { quantity: { gt: 0 } },
            },
          },
        },
      },
    });

    // Calculate movement metrics for each drug
    const drugMetrics: Record<
      string,
      {
        drugId: string;
        brandName: string;
        category: string;
        totalSold: number;
        currentStock: number;
        revenue: number;
        daysInStock: number;
        turnoverRate: number;
      }
    > = {};

    // Aggregate sales by drug
    for (const item of saleItems) {
      if (!item.drug) continue;

      const drugId = item.drugId;
      if (!drugMetrics[drugId]) {
        const currentStock = item.drug.inventoryBatches.reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );
        drugMetrics[drugId] = {
          drugId,
          brandName: item.drug.brandName,
          category: item.drug.category || 'Uncategorized',
          totalSold: 0,
          currentStock,
          revenue: 0,
          daysInStock: 30,
          turnoverRate: 0,
        };
      }

      drugMetrics[drugId].totalSold += item.quantity;
      drugMetrics[drugId].revenue += Number(item.subtotal || 0);
    }

    // Calculate turnover rate for each drug
    const drugAnalysis = Object.values(drugMetrics).map((drug) => {
      // Turnover rate = units sold per day
      const dailySales = drug.totalSold / 30;
      const turnoverRate = drug.currentStock > 0 ? dailySales / drug.currentStock : dailySales;

      return {
        ...drug,
        turnoverRate,
      };
    });

    // Sort by turnover rate
    drugAnalysis.sort((a, b) => b.totalSold - a.totalSold);

    // Get drugs with actual sales
    const drugsWithSales = drugAnalysis.filter((d) => d.totalSold > 0);

    // Fast-moving: Top sellers
    const fastMoving = drugsWithSales.slice(0, 6).map((d) => ({
      name: d.brandName,
      value: d.totalSold * 5,
      category: d.category,
      revenue: d.revenue,
      stock: d.currentStock,
      soldUnits: d.totalSold,
      type: 'fast-moving' as const,
    }));

    // Slow-moving: Drugs with high stock but low sales
    const slowMoving = drugAnalysis
      .filter((d) => d.currentStock > 50 && d.totalSold < 30)
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 13)
      .map((d) => ({
        name: d.brandName,
        value: Math.min(d.currentStock, 300),
        category: d.category,
        revenue: d.revenue,
        stock: d.currentStock,
        soldUnits: d.totalSold,
        type: 'slow-moving' as const,
      }));

    return {
      fastMoving,
      slowMoving,
    };
  }
}

export const dashboardService = new DashboardService();
