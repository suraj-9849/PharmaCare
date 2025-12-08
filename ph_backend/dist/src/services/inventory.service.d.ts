import { CreateBatchRequest } from '../types';
export declare class InventoryService {
    /**
     * Get all inventory batches with pagination
     */
    getAllBatches(page?: number, limit?: number, drugId?: string): Promise<{
        batches: ({
            drug: {
                id: string;
                sku: string;
                genericName: string;
                brandName: string;
            };
            supplier: {
                id: string;
                supplierName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            drugId: string;
            batchNumber: string;
            quantity: number;
            purchasePrice: import("@prisma/client/runtime/client").Decimal;
            sellPrice: import("@prisma/client/runtime/client").Decimal;
            expiryDate: Date;
            supplierId: string;
            location: string | null;
            dateAdded: Date;
        })[];
        pagination: {
            currentPage: number;
            itemsPerPage: number;
            totalPages: number;
            totalItems: number;
            offset: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    /**
     * Get batch by ID
     */
    getBatchById(id: string): Promise<{
        drug: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            genericName: string;
            brandName: string;
            category: string;
            manufacturer: string;
            requiresPrescription: boolean;
            reorderLevel: number;
        };
        supplier: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    }>;
    /**
     * Create new batch (stock in)
     */
    createBatch(data: CreateBatchRequest): Promise<{
        drug: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            genericName: string;
            brandName: string;
            category: string;
            manufacturer: string;
            requiresPrescription: boolean;
            reorderLevel: number;
        };
        supplier: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    }>;
    /**
     * Update batch
     */
    updateBatch(id: string, data: Partial<CreateBatchRequest>): Promise<{
        drug: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            genericName: string;
            brandName: string;
            category: string;
            manufacturer: string;
            requiresPrescription: boolean;
            reorderLevel: number;
        };
        supplier: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    }>;
    /**
     * Delete batch
     */
    deleteBatch(id: string): Promise<void>;
    /**
     * Get expiring batches
     */
    getExpiringBatches(days?: number): Promise<({
        drug: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            genericName: string;
            brandName: string;
            category: string;
            manufacturer: string;
            requiresPrescription: boolean;
            reorderLevel: number;
        };
        supplier: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    })[]>;
    /**
     * Get expired batches
     */
    getExpiredBatches(): Promise<({
        drug: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            genericName: string;
            brandName: string;
            category: string;
            manufacturer: string;
            requiresPrescription: boolean;
            reorderLevel: number;
        };
        supplier: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    })[]>;
    /**
     * Get stock summary by drug
     */
    getStockSummary(): Promise<{
        drugId: any;
        brandName: any;
        genericName: any;
        totalStock: any;
        reorderLevel: any;
        isLowStock: boolean;
        expiringCount: any;
        expiredCount: any;
    }[]>;
    /**
     * Get available batches for a drug (for sale)
     */
    getAvailableBatches(drugId: string): Promise<({
        drug: {
            genericName: string;
            brandName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        drugId: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: import("@prisma/client/runtime/client").Decimal;
        sellPrice: import("@prisma/client/runtime/client").Decimal;
        expiryDate: Date;
        supplierId: string;
        location: string | null;
        dateAdded: Date;
    })[]>;
}
export declare const inventoryService: InventoryService;
//# sourceMappingURL=inventory.service.d.ts.map