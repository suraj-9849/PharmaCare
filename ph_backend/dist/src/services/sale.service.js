"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleService = exports.SaleService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class SaleService {
    /**
     * Create a new sale
     */
    async createSale(userId, data) {
        // Validate stock availability
        for (const item of data.items) {
            const batch = await database_1.default.inventoryBatch.findUnique({
                where: { id: item.batchId },
            });
            if (!batch) {
                throw new Error(`${constants_1.ERROR_MESSAGES.BATCH_NOT_FOUND}: ${item.batchId}`);
            }
            if (batch.quantity < item.quantity) {
                throw new Error(`${constants_1.ERROR_MESSAGES.INSUFFICIENT_STOCK} for batch ${item.batchId}`);
            }
        }
        // Calculate totals and create sale
        const sale = await database_1.default.$transaction(async (tx) => {
            // Get batch prices and calculate items
            const saleItems = await Promise.all(data.items.map(async (item) => {
                const batch = await tx.inventoryBatch.findUnique({
                    where: { id: item.batchId },
                });
                if (!batch) {
                    throw new Error(constants_1.ERROR_MESSAGES.BATCH_NOT_FOUND);
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
            }));
            // Calculate total
            const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
            // Calculate change if cash payment
            let changeGiven = null;
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
    async getAllSales(page = 1, limit = 10, startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) {
                where.saleDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.saleDate.lte = new Date(endDate);
            }
        }
        const total = await database_1.default.sale.count({ where });
        const pagination = (0, helpers_1.calculatePagination)(page, limit, total);
        const sales = await database_1.default.sale.findMany({
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
    async getSaleById(id) {
        const sale = await database_1.default.sale.findUnique({
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
            throw new Error(constants_1.ERROR_MESSAGES.SALE_NOT_FOUND);
        }
        return sale;
    }
    /**
     * Cancel sale
     */
    async cancelSale(id) {
        const sale = await database_1.default.sale.findUnique({
            where: { id },
            include: { saleItems: true },
        });
        if (!sale) {
            throw new Error(constants_1.ERROR_MESSAGES.SALE_NOT_FOUND);
        }
        // Restore inventory
        await database_1.default.$transaction(async (tx) => {
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
        const startOfToday = (0, helpers_1.getStartOfToday)();
        const endOfToday = (0, helpers_1.getEndOfToday)();
        const sales = await database_1.default.sale.findMany({
            where: {
                saleDate: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                status: 'COMPLETED',
            },
        });
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        return {
            totalSales,
            totalRevenue,
        };
    }
    /**
     * Get sales statistics
     */
    async getSalesStats(period = 'day') {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = (0, helpers_1.getStartOfToday)();
        }
        const sales = await database_1.default.sale.findMany({
            where: {
                saleDate: { gte: startDate },
                status: 'COMPLETED',
            },
            include: {
                saleItems: true,
            },
        });
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.saleItems.reduce((s, item) => s + item.quantity, 0), 0);
        return {
            period,
            totalSales,
            totalRevenue,
            totalItems,
            averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
        };
    }
}
exports.SaleService = SaleService;
exports.saleService = new SaleService();
//# sourceMappingURL=sale.service.js.map