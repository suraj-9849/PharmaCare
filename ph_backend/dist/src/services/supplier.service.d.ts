import { CreateSupplierRequest } from '../types';
export declare class SupplierService {
    /**
     * Get all suppliers with pagination
     */
    getAllSuppliers(page?: number, limit?: number, search?: string): Promise<{
        suppliers: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            supplierName: string;
            contactNumber: string;
            address: string;
        }[];
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
     * Get supplier by ID
     */
    getSupplierById(id: string): Promise<{
        inventoryBatches: ({
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
        email: string;
        createdAt: Date;
        updatedAt: Date;
        supplierName: string;
        contactNumber: string;
        address: string;
    }>;
    /**
     * Create new supplier
     */
    createSupplier(data: CreateSupplierRequest): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        supplierName: string;
        contactNumber: string;
        address: string;
    }>;
    /**
     * Update supplier
     */
    updateSupplier(id: string, data: Partial<CreateSupplierRequest>): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        supplierName: string;
        contactNumber: string;
        address: string;
    }>;
    /**
     * Delete supplier
     */
    deleteSupplier(id: string): Promise<void>;
    /**
     * Get all suppliers (for dropdown)
     */
    getAllSuppliersSimple(): Promise<{
        id: string;
        supplierName: string;
    }[]>;
}
export declare const supplierService: SupplierService;
//# sourceMappingURL=supplier.service.d.ts.map