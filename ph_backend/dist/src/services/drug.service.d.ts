import { CreateDrugRequest } from '../types';
export declare class DrugService {
    /**
     * Get all drugs with pagination
     */
    getAllDrugs(page?: number, limit?: number, search?: string): Promise<{
        drugs: ({
            inventoryBatches: {
                id: string;
                quantity: number;
                sellPrice: import("@prisma/client/runtime/client").Decimal;
                expiryDate: Date;
            }[];
        } & {
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
     * Get drug by ID
     */
    getDrugById(id: string): Promise<{
        inventoryBatches: ({
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
        })[];
    } & {
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
    }>;
    /**
     * Create new drug
     */
    createDrug(data: CreateDrugRequest): Promise<{
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
    }>;
    /**
     * Update drug
     */
    updateDrug(id: string, data: Partial<CreateDrugRequest>): Promise<{
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
    }>;
    /**
     * Delete drug
     */
    deleteDrug(id: string): Promise<void>;
    /**
     * Get low stock drugs
     */
    getLowStockDrugs(): Promise<({
        inventoryBatches: {
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
        }[];
    } & {
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
    })[]>;
    /**
     * Get drug categories
     */
    getCategories(): Promise<(import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.DrugGroupByOutputType, "category"[]> & {
        _count: number;
    })[]>;
}
export declare const drugService: DrugService;
//# sourceMappingURL=drug.service.d.ts.map