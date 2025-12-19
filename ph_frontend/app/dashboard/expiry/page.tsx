'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, AlertTriangle, Calendar, Package, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { InventoryBatch, PaginatedResponse } from '@/lib/types';

export default function ExpiryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState<string>('30');

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', {
        limit: 200,
      });
      setBatches(response.data || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const filteredBatches = batches
    .filter((batch) => {
      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
      const maxDays = parseInt(daysFilter) || 30;

      if (daysLeft > maxDays) return false;

      const matchesSearch =
        batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.drug?.brandName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

  const expiredCount = batches.filter((b) => getDaysUntilExpiry(b.expiryDate) <= 0).length;
  const expiringWeekCount = batches.filter((b) => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return days > 0 && days <= 7;
  }).length;
  const expiringMonthCount = batches.filter((b) => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return days > 7 && days <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expiry Alerts</h1>
        <p className="text-gray-500">Monitor products nearing expiration</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Expired</p>
                <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Expiring in 7 days</p>
                <p className="text-2xl font-bold text-amber-700">{expiringWeekCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600">Expiring in 30 days</p>
                <p className="text-2xl font-bold text-yellow-700">{expiringMonthCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="14">Next 14 days</SelectItem>
                <SelectItem value="30">Next 30 days</SelectItem>
                <SelectItem value="60">Next 60 days</SelectItem>
                <SelectItem value="90">Next 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expiry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Products Expiring Soon
          </CardTitle>
          <CardDescription>
            Showing {filteredBatches.length} items expiring within {daysFilter} days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No expiring products</p>
              <p className="text-sm">All products are within safe expiry range</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const daysLeft = getDaysUntilExpiry(batch.expiryDate);

                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                daysLeft <= 0
                                  ? 'bg-red-100'
                                  : daysLeft <= 7
                                    ? 'bg-amber-100'
                                    : 'bg-yellow-100'
                              )}
                            >
                              <Package
                                className={cn(
                                  'h-5 w-5',
                                  daysLeft <= 0
                                    ? 'text-red-600'
                                    : daysLeft <= 7
                                      ? 'text-amber-600'
                                      : 'text-yellow-600'
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{batch.drug?.brandName}</p>
                              <p className="text-sm text-gray-500">{batch.drug?.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                        <TableCell>
                          {formatCurrency(batch.quantity * Number(batch.sellPrice))}
                        </TableCell>
                        <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              daysLeft <= 0 && 'border-red-200 bg-red-50 text-red-700',
                              daysLeft > 0 &&
                                daysLeft <= 7 &&
                                'border-amber-200 bg-amber-50 text-amber-700',
                              daysLeft > 7 &&
                                daysLeft <= 14 &&
                                'border-orange-200 bg-orange-50 text-orange-700',
                              daysLeft > 14 && 'border-yellow-200 bg-yellow-50 text-yellow-700'
                            )}
                          >
                            {daysLeft <= 0
                              ? 'Expired'
                              : daysLeft === 1
                                ? '1 day left'
                                : `${daysLeft} days left`}
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
    </div>
  );
}
