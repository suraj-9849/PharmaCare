'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  DashboardStats,
  DashboardData,
  Sale,
  InventoryBatch,
  PaginatedResponse,
  ChartData,
  TopSellingDrug,
  PaymentMethodData,
} from '@/lib/types';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        statsRes,
        chartRes,
        topSellingRes,
        salesRes,
        inventoryRes,
        inventoryByCategoryRes,
        drugMovementRes,
      ] = await Promise.all([
        apiClient.dashboard.getStats(),
        apiClient.dashboard.getChart(7),
        apiClient.dashboard.getTopSelling(5),
        apiClient.get<PaginatedResponse<Sale>>('/sales', { limit: 10 }),
        apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', { limit: 100 }),
        apiClient.get<{ name: string; stock: number; reorderLevel: number }[]>(
          '/dashboard/inventory-by-category'
        ),
        apiClient.get('/dashboard/drug-movement'),
      ]);

      // Process stats
      const stats: DashboardStats = (statsRes as { data?: DashboardStats }).data || {};

      // Process chart data
      const chartData: ChartData[] = (chartRes as { data?: ChartData[] }).data || [];

      // Process top selling drugs
      const topSellingDrugs: TopSellingDrug[] =
        (topSellingRes as { data?: TopSellingDrug[] }).data || [];

      // Process recent sales
      const recentSales = (salesRes as PaginatedResponse<Sale>).data || [];

      // Process payment methods from recent sales
      const paymentMethodMap: Record<string, number> = {};
      recentSales.forEach((sale) => {
        const method = sale.paymentMethod || 'CASH';
        paymentMethodMap[method] = (paymentMethodMap[method] || 0) + Number(sale.totalAmount);
      });

      const paymentMethods: PaymentMethodData[] = Object.entries(paymentMethodMap).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      // Process inventory for expiring and low stock
      const batches = (inventoryRes as PaginatedResponse<InventoryBatch>).data || [];
      const now = new Date();

      const expiringBatches = batches
        .filter((b) => {
          const daysLeft = Math.ceil(
            (new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysLeft > 0 && daysLeft <= 30;
        })
        .slice(0, 10);

      const lowStockBatches = batches
        .filter((b) => {
          const drug = b.drug;
          return drug && b.quantity <= (drug.reorderLevel || 10);
        })
        .slice(0, 10);

      // Get inventory by category from API
      const inventoryByCategory =
        (
          inventoryByCategoryRes as {
            data?: { name: string; stock: number; reorderLevel: number }[];
          }
        ).data || [];

      // Get drug movement data from API
      const drugMovement = (drugMovementRes as { data?: { fastMoving: unknown[]; slowMoving: unknown[] } }).data || {
        fastMoving: [],
        slowMoving: [],
      };

      // Update stats with counts
      stats.expiringCount = expiringBatches.length;
      stats.lowStockCount = lowStockBatches.length;

      setData({
        stats,
        chartData,
        topSellingDrugs,
        recentSales,
        expiringBatches,
        lowStockBatches,
        drugMovement,
        paymentMethods,
        inventoryByCategory,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
