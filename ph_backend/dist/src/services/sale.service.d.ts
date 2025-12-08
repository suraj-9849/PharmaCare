import { CreateSaleRequest } from '../types';
export declare class SaleService {
    /**
     * Create a new sale
     */
    createSale(userId: string, data: CreateSaleRequest): Promise<{
        user: {
            id: string;
            username: string;
        };
        saleItems: ({
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
            batch: {
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
            };
        } & {
            id: string;
            drugId: string;
            quantity: number;
            batchId: string;
            unitPrice: import("@prisma/client/runtime/client").Decimal;
            subtotal: import("@prisma/client/runtime/client").Decimal;
            saleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        totalAmount: import("@prisma/client/runtime/client").Decimal;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        cashReceived: import("@prisma/client/runtime/client").Decimal | null;
        changeGiven: import("@prisma/client/runtime/client").Decimal | null;
        saleDate: Date;
        status: import("@prisma/client").$Enums.SaleStatus;
        userId: string;
    }>;
    /**
     * Get all sales with pagination
     */
    getAllSales(page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        sales: ({
            user: {
                id: string;
                username: string;
            };
            saleItems: ({
                drug: {
                    genericName: string;
                    brandName: string;
                };
            } & {
                id: string;
                drugId: string;
                quantity: number;
                batchId: string;
                unitPrice: import("@prisma/client/runtime/client").Decimal;
                subtotal: import("@prisma/client/runtime/client").Decimal;
                saleId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            totalAmount: import("@prisma/client/runtime/client").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            cashReceived: import("@prisma/client/runtime/client").Decimal | null;
            changeGiven: import("@prisma/client/runtime/client").Decimal | null;
            saleDate: Date;
            status: import("@prisma/client").$Enums.SaleStatus;
            userId: string;
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
     * Get sale by ID
     */
    getSaleById(id: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
        };
        saleItems: ({
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
            batch: {
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
            };
        } & {
            id: string;
            drugId: string;
            quantity: number;
            batchId: string;
            unitPrice: import("@prisma/client/runtime/client").Decimal;
            subtotal: import("@prisma/client/runtime/client").Decimal;
            saleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        totalAmount: import("@prisma/client/runtime/client").Decimal;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        cashReceived: import("@prisma/client/runtime/client").Decimal | null;
        changeGiven: import("@prisma/client/runtime/client").Decimal | null;
        saleDate: Date;
        status: import("@prisma/client").$Enums.SaleStatus;
        userId: string;
    }>;
    /**
     * Cancel sale
     */
    cancelSale(id: string): Promise<{
        message: string;
    }>;
    /**
     * Get today's sales summary
     */
    getTodaysSalesSummary(): Promise<{
        totalSales: number;
        totalRevenue: number;
    }>;
    /**
     * Get sales statistics
     */
    getSalesStats(period?: 'day' | 'week' | 'month'): Promise<{
        period: "day" | "week" | "month";
        totalSales: number;
        totalRevenue: number;
        totalItems: number;
        averageOrderValue: number;
    }>;
}
export declare const saleService: SaleService;
//# sourceMappingURL=sale.service.d.ts.map