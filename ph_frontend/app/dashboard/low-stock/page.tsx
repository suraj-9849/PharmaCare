'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Package, AlertTriangle, TrendingDown, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { InventoryBatch, Drug, PaginatedResponse } from '@/lib/types';

interface DrugStock {
  drug: Drug;
  totalQuantity: number;
  reorderLevel: number;
  batches: InventoryBatch[];
  stockPercentage: number;
}

export default function LowStockPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [batchesRes, drugsRes] = await Promise.all([
        apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', { limit: 200 }),
        apiClient.get<PaginatedResponse<Drug>>('/drugs', { limit: 200 }),
      ]);
      setBatches(batchesRes.data || []);
      setDrugs(drugsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate stock by drug
  const drugStocks: DrugStock[] = drugs
    .map((drug) => {
      const drugBatches = batches.filter((b) => b.drugId === drug.id);
      const totalQuantity = drugBatches.reduce((sum, b) => sum + b.quantity, 0);
      const stockPercentage = Math.min((totalQuantity / drug.reorderLevel) * 100, 100);

      return {
        drug,
        totalQuantity,
        reorderLevel: drug.reorderLevel,
        batches: drugBatches,
        stockPercentage,
      };
    })
    .filter((ds) => ds.totalQuantity <= ds.reorderLevel * 1.5); // Show items at or below 150% of reorder level

  const filteredStocks = drugStocks
    .filter(
      (ds) =>
        ds.drug.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.drug.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.stockPercentage - b.stockPercentage);

  const criticalCount = drugStocks.filter(
    (ds) => ds.totalQuantity <= ds.reorderLevel * 0.25
  ).length;
  const lowCount = drugStocks.filter((ds) => {
    const pct = ds.totalQuantity / ds.reorderLevel;
    return pct > 0.25 && pct <= 0.5;
  }).length;
  const warningCount = drugStocks.filter((ds) => {
    const pct = ds.totalQuantity / ds.reorderLevel;
    return pct > 0.5 && pct <= 1;
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Alert</h1>
        <p className="text-gray-500">Monitor and manage low inventory levels</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Critical (0-25%)</p>
                <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Low (25-50%)</p>
                <p className="text-2xl font-bold text-orange-700">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Warning (50-100%)</p>
                <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Low Stock Items
          </CardTitle>
          <CardDescription>
            Showing {filteredStocks.length} items below or near reorder level
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">All stocked up!</p>
              <p className="text-sm">No products are below reorder level</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => {
                    const pct = stock.stockPercentage;

                    return (
                      <TableRow key={stock.drug.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                pct <= 25
                                  ? 'bg-red-100'
                                  : pct <= 50
                                    ? 'bg-orange-100'
                                    : 'bg-amber-100'
                              )}
                            >
                              <Package
                                className={cn(
                                  'h-5 w-5',
                                  pct <= 25
                                    ? 'text-red-600'
                                    : pct <= 50
                                      ? 'text-orange-600'
                                      : 'text-amber-600'
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{stock.drug.brandName}</p>
                              <p className="text-sm text-gray-500">
                                {stock.drug.manufacturer || 'Unknown manufacturer'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {stock.drug.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'font-medium',
                              pct <= 25
                                ? 'text-red-600'
                                : pct <= 50
                                  ? 'text-orange-600'
                                  : 'text-amber-600'
                            )}
                          >
                            {stock.totalQuantity}
                          </span>
                        </TableCell>
                        <TableCell>{stock.reorderLevel}</TableCell>
                        <TableCell className="w-40">
                          <div className="space-y-1">
                            <Progress
                              value={pct}
                              className={cn(
                                'h-2',
                                pct <= 25
                                  ? '[&>div]:bg-red-500'
                                  : pct <= 50
                                    ? '[&>div]:bg-orange-500'
                                    : pct <= 75
                                      ? '[&>div]:bg-amber-500'
                                      : '[&>div]:bg-yellow-500'
                              )}
                            />
                            <p className="text-xs text-gray-500">
                              {Math.round(pct)}% of reorder level
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              pct <= 25 && 'border-red-200 bg-red-50 text-red-700',
                              pct > 25 &&
                                pct <= 50 &&
                                'border-orange-200 bg-orange-50 text-orange-700',
                              pct > 50 &&
                                pct <= 100 &&
                                'border-amber-200 bg-amber-50 text-amber-700',
                              pct > 100 && 'border-yellow-200 bg-yellow-50 text-yellow-700'
                            )}
                          >
                            {pct <= 25
                              ? 'Critical'
                              : pct <= 50
                                ? 'Low'
                                : pct <= 100
                                  ? 'Warning'
                                  : 'Near Reorder'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Reorder Recommendations */}
      {filteredStocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reorder Recommendations</CardTitle>
            <CardDescription>Suggested quantities to bring stock to optimal levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStocks
                .filter((s) => s.totalQuantity < s.reorderLevel)
                .slice(0, 6)
                .map((stock) => {
                  const reorderQty = stock.reorderLevel * 2 - stock.totalQuantity;

                  return (
                    <div key={stock.drug.id} className="rounded-lg border p-4 space-y-2">
                      <p className="font-medium text-gray-900">{stock.drug.brandName}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current:</span>
                        <span className="font-medium">{stock.totalQuantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Suggested Order:</span>
                        <span className="font-medium text-emerald-600">+{reorderQty} units</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
