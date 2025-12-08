export declare class DashboardService {
    /**
     * Get dashboard statistics
     */
    getDashboardStats(): Promise<{
        todaySales: number;
        todayRevenue: number;
        todayCancellations: number;
        totalProducts: number;
        totalSales: number;
        totalRevenue: number;
        lowStockCount: number;
        expiringCount: number;
        expiredCount: number;
        recentSales: ({
            user: {
                username: string;
            };
            saleItems: ({
                drug: {
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
            saleDate: Date;
            userId: string;
            totalAmount: import("@prisma/client/runtime/client").Decimal;
            paymentMethod: import("../../generated/prisma/enums").PaymentMethod;
            cashReceived: import("@prisma/client/runtime/client").Decimal | null;
            changeGiven: import("@prisma/client/runtime/client").Decimal | null;
            status: import("../../generated/prisma/enums").SaleStatus;
        })[];
        stockAlerts: {
            id: string;
            createdAt: Date;
            drugId: string;
            alertType: string;
            message: string;
            isRead: boolean;
        }[];
    }>;
    /**
     * Get sales chart data
     */
    getSalesChartData(days?: number): Promise<{
        date: string;
        sales: number;
        revenue: number;
    }[]>;
    /**
     * Get top selling drugs
     */
    getTopSellingDrugs(limit?: number): Promise<{
        drugId: any;
        brandName: string;
        genericName: string;
        totalQuantity: any;
        totalRevenue: number;
    }[]>;
}
export declare const dashboardService: DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map