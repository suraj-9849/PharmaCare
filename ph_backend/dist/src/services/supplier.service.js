"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierService = exports.SupplierService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class SupplierService {
    /**
     * Get all suppliers with pagination
     */
    async getAllSuppliers(page = 1, limit = 10, search) {
        const where = search
            ? {
                OR: [
                    { supplierName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const total = await database_1.default.supplier.count({ where });
        const pagination = (0, helpers_1.calculatePagination)(page, limit, total);
        const suppliers = await database_1.default.supplier.findMany({
            where,
            skip: pagination.offset,
            take: pagination.itemsPerPage,
            orderBy: { createdAt: 'desc' },
        });
        return { suppliers, pagination };
    }
    /**
     * Get supplier by ID
     */
    async getSupplierById(id) {
        const supplier = await database_1.default.supplier.findUnique({
            where: { id },
            include: {
                inventoryBatches: {
                    include: {
                        drug: true,
                    },
                    orderBy: { dateAdded: 'desc' },
                    take: 10,
                },
            },
        });
        if (!supplier) {
            throw new Error(constants_1.ERROR_MESSAGES.SUPPLIER_NOT_FOUND);
        }
        return supplier;
    }
    /**
     * Create new supplier
     */
    async createSupplier(data) {
        const supplier = await database_1.default.supplier.create({
            data: {
                supplierName: data.supplierName,
                contactNumber: data.contactNumber,
                email: data.email,
                address: data.address,
            },
        });
        return supplier;
    }
    /**
     * Update supplier
     */
    async updateSupplier(id, data) {
        const supplier = await database_1.default.supplier.update({
            where: { id },
            data,
        });
        return supplier;
    }
    /**
     * Delete supplier
     */
    async deleteSupplier(id) {
        await database_1.default.supplier.delete({
            where: { id },
        });
    }
    /**
     * Get all suppliers (for dropdown)
     */
    async getAllSuppliersSimple() {
        return database_1.default.supplier.findMany({
            select: {
                id: true,
                supplierName: true,
            },
            orderBy: { supplierName: 'asc' },
        });
    }
}
exports.SupplierService = SupplierService;
exports.supplierService = new SupplierService();
//# sourceMappingURL=supplier.service.js.map