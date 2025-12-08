'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  DashboardStats,
  DashboardData,
  Sale,
  InventoryBatch,
  PaginatedResponse,
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
      const [statsRes, salesRes, inventoryRes] = await Promise.all([
        apiClient.dashboard.getStats(),
        apiClient.get<PaginatedResponse<Sale>>('/sales', { limit: 10 }),
        apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', { limit: 100 }),
      ]);

      // Process stats
      const stats: DashboardStats = (statsRes as { data?: DashboardStats }).data || {};

      // Process recent sales
      const recentSales = (salesRes as PaginatedResponse<Sale>).data || [];

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

      // Update stats with counts
      stats.expiringCount = expiringBatches.length;
      stats.lowStockCount = lowStockBatches.length;

      setData({
        stats,
        recentSales,
        expiringBatches,
        lowStockBatches,
        topSellingDrugs: [],
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
