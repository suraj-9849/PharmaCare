"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
class DashboardService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        const startOfToday = (0, helpers_1.getStartOfToday)();
        const endOfToday = (0, helpers_1.getEndOfToday)();
        // Today's sales
        const todaySales = await database_1.default.sale.findMany({
            where: {
                saleDate: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                status: 'COMPLETED',
            },
        });
        const todaySalesCount = todaySales.length;
        const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        // Total products
        const totalProducts = await database_1.default.drug.count();
        // Total sales (all time)
        const totalSalesCount = await database_1.default.sale.count({
            where: { status: 'COMPLETED' },
        });
        const allSales = await database_1.default.sale.findMany({
            where: { status: 'COMPLETED' },
        });
        const totalRevenue = allSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        // Stock alerts
        const drugs = await database_1.default.drug.findMany({
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
            const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
            if (totalStock <= drug.reorderLevel) {
                lowStockCount++;
            }
            for (const batch of drug.inventoryBatches) {
                if ((0, helpers_1.isExpired)(batch.expiryDate)) {
                    expiredCount++;
                }
                else if ((0, helpers_1.isExpiringSoon)(batch.expiryDate)) {
                    expiringCount++;
                }
            }
        }
        // Recent sales
        const recentSales = await database_1.default.sale.findMany({
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
        const stockAlerts = await database_1.default.stockAlert.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: { isRead: false },
        });
        // Cancellations today
        const todayCancellations = await database_1.default.sale.count({
            where: {
                saleDate: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                status: 'CANCELLED',
            },
        });
        return {
            todaySales: todaySalesCount,
            todayRevenue,
            todayCancellations,
            totalProducts,
            totalSales: totalSalesCount,
            totalRevenue,
            lowStockCount,
            expiringCount,
            expiredCount,
            recentSales,
            stockAlerts,
        };
    }
    /**
     * Get sales chart data
     */
    async getSalesChartData(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        const sales = await database_1.default.sale.findMany({
            where: {
                saleDate: { gte: startDate },
                status: 'COMPLETED',
            },
            orderBy: { saleDate: 'asc' },
        });
        // Group by date
        const chartData = {};
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
    async getTopSellingDrugs(limit = 5) {
        const saleItems = await database_1.default.saleItem.groupBy({
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
        const drugIds = saleItems.map((item) => item.drugId);
        const drugs = await database_1.default.drug.findMany({
            where: { id: { in: drugIds } },
        });
        return saleItems.map((item) => {
            const drug = drugs.find((d) => d.id === item.drugId);
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
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
//# sourceMappingURL=dashboard.service.js.map