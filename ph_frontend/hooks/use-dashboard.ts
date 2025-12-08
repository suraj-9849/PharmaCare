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
      const [statsRes, chartRes, topSellingRes, salesRes, inventoryRes] = await Promise.all([
        apiClient.dashboard.getStats(),
        apiClient.dashboard.getChart(7),
        apiClient.dashboard.getTopSelling(5),
        apiClient.get<PaginatedResponse<Sale>>('/sales', { limit: 10 }),
        apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', { limit: 100 }),
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

      // Calculate revenue by category (from sale items)
      const categoryRevenueMap: Record<string, number> = {};
      recentSales.forEach((sale) => {
        (sale.items || sale.saleItems || []).forEach((item) => {
          const category = item.drug?.category || 'Other';
          categoryRevenueMap[category] =
            (categoryRevenueMap[category] || 0) + Number(item.unitPrice || 0) * item.quantity;
        });
      });

      const revenueByCategory = Object.entries(categoryRevenueMap).map(([name, value]) => ({
        name,
        value,
      }));

      // Calculate inventory by category
      const categoryStockMap: Record<
        string,
        { stock: number; count: number; reorderLevel: number }
      > = {};

      batches.forEach((batch) => {
        const category = batch.drug?.category || 'Other';
        if (!categoryStockMap[category]) {
          categoryStockMap[category] = { stock: 0, count: 0, reorderLevel: 0 };
        }
        categoryStockMap[category].stock += batch.quantity;
        categoryStockMap[category].count += 1;
        categoryStockMap[category].reorderLevel += batch.drug?.reorderLevel || 10;
      });

      const inventoryByCategory = Object.entries(categoryStockMap).map(([name, data]) => ({
        name,
        stock: data.stock,
        reorderLevel: Math.ceil(data.reorderLevel / data.count),
      }));

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
        revenueByCategory,
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
