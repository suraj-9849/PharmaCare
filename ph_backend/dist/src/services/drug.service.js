"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.drugService = exports.DrugService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class DrugService {
    /**
     * Get all drugs with pagination
     */
    async getAllDrugs(page = 1, limit = 10, search) {
        const where = search
            ? {
                OR: [
                    { brandName: { contains: search, mode: 'insensitive' } },
                    { genericName: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const total = await database_1.default.drug.count({ where });
        const pagination = (0, helpers_1.calculatePagination)(page, limit, total);
        const drugs = await database_1.default.drug.findMany({
            where,
            skip: pagination.offset,
            take: pagination.itemsPerPage,
            orderBy: { createdAt: 'desc' },
            include: {
                inventoryBatches: {
                    select: {
                        id: true,
                        quantity: true,
                        sellPrice: true,
                        expiryDate: true,
                    },
                },
            },
        });
        return { drugs, pagination };
    }
    /**
     * Get drug by ID
     */
    async getDrugById(id) {
        const drug = await database_1.default.drug.findUnique({
            where: { id },
            include: {
                inventoryBatches: {
                    include: {
                        supplier: true,
                    },
                    orderBy: { expiryDate: 'asc' },
                },
            },
        });
        if (!drug) {
            throw new Error(constants_1.ERROR_MESSAGES.DRUG_NOT_FOUND);
        }
        return drug;
    }
    /**
     * Create new drug
     */
    async createDrug(data) {
        const sku = (0, helpers_1.generateSKU)(data.category, data.brandName);
        const drug = await database_1.default.drug.create({
            data: {
                brandName: data.brandName,
                genericName: data.genericName,
                category: data.category,
                manufacturer: data.manufacturer,
                requiresPrescription: data.requiresPrescription || false,
                reorderLevel: data.reorderLevel || 10,
                sku,
            },
        });
        return drug;
    }
    /**
     * Update drug
     */
    async updateDrug(id, data) {
        const drug = await database_1.default.drug.update({
            where: { id },
            data,
        });
        return drug;
    }
    /**
     * Delete drug
     */
    async deleteDrug(id) {
        await database_1.default.drug.delete({
            where: { id },
        });
    }
    /**
     * Get low stock drugs
     */
    async getLowStockDrugs() {
        const drugs = await database_1.default.drug.findMany({
            include: {
                inventoryBatches: true,
            },
        });
        const lowStockDrugs = drugs.filter((drug) => {
            const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
            return totalStock <= drug.reorderLevel;
        });
        return lowStockDrugs;
    }
    /**
     * Get drug categories
     */
    async getCategories() {
        const categories = await database_1.default.drug.groupBy({
            by: ['category'],
            _count: true,
        });
        return categories;
    }
}
exports.DrugService = DrugService;
exports.drugService = new DrugService();
//# sourceMappingURL=drug.service.js.map