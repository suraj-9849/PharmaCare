"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class InventoryService {
    /**
     * Get all inventory batches with pagination
     */
    async getAllBatches(page = 1, limit = 10, drugId) {
        const where = drugId ? { drugId } : {};
        const total = await database_1.default.inventoryBatch.count({ where });
        const pagination = (0, helpers_1.calculatePagination)(page, limit, total);
        const batches = await database_1.default.inventoryBatch.findMany({
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
    async getBatchById(id) {
        const batch = await database_1.default.inventoryBatch.findUnique({
            where: { id },
            include: {
                drug: true,
                supplier: true,
            },
        });
        if (!batch) {
            throw new Error(constants_1.ERROR_MESSAGES.BATCH_NOT_FOUND);
        }
        return batch;
    }
    /**
     * Create new batch (stock in)
     */
    async createBatch(data) {
        const batch = await database_1.default.inventoryBatch.create({
            data: {
                drugId: data.drugId,
                batchNumber: data.batchNumber,
                quantity: data.quantity,
                purchasePrice: data.purchasePrice,
                sellPrice: data.sellPrice,
                expiryDate: new Date(data.expiryDate),
                supplierId: data.supplierId,
                location: data.location,
            },
            include: {
                drug: true,
                supplier: true,
            },
        });
        return batch;
    }
    /**
     * Update batch
     */
    async updateBatch(id, data) {
        const updateData = { ...data };
        if (data.expiryDate) {
            updateData.expiryDate = new Date(data.expiryDate);
        }
        const batch = await database_1.default.inventoryBatch.update({
            where: { id },
            data: updateData,
            include: {
                drug: true,
                supplier: true,
            },
        });
        return batch;
    }
    /**
     * Delete batch
     */
    async deleteBatch(id) {
        await database_1.default.inventoryBatch.delete({
            where: { id },
        });
    }
    /**
     * Get expiring batches
     */
    async getExpiringBatches(days = 30) {
        const batches = await database_1.default.inventoryBatch.findMany({
            where: {
                quantity: { gt: 0 },
            },
            include: {
                drug: true,
                supplier: true,
            },
        });
        return batches.filter((batch) => (0, helpers_1.isExpiringSoon)(batch.expiryDate, days));
    }
    /**
     * Get expired batches
     */
    async getExpiredBatches() {
        const batches = await database_1.default.inventoryBatch.findMany({
            where: {
                quantity: { gt: 0 },
            },
            include: {
                drug: true,
                supplier: true,
            },
        });
        return batches.filter((batch) => (0, helpers_1.isExpired)(batch.expiryDate));
    }
    /**
     * Get stock summary by drug
     */
    async getStockSummary() {
        const drugs = await database_1.default.drug.findMany({
            include: {
                inventoryBatches: {
                    where: {
                        quantity: { gt: 0 },
                    },
                },
            },
        });
        return drugs.map((drug) => {
            const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
            const expiringBatches = drug.inventoryBatches.filter((batch) => (0, helpers_1.isExpiringSoon)(batch.expiryDate));
            const expiredBatches = drug.inventoryBatches.filter((batch) => (0, helpers_1.isExpired)(batch.expiryDate));
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
    async getAvailableBatches(drugId) {
        const now = new Date();
        const batches = await database_1.default.inventoryBatch.findMany({
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
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map