'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  AlertCircle,
  Receipt,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { NewSaleDialog } from '@/components/sales/new-sale-dialog';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { Sale, SaleItem, InventoryBatch, PaginatedResponse } from '@/lib/types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<Sale>>('/sales', {
        limit: 100,
      });
      setSales(response.data || []);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', {
        limit: 100,
      });
      // Only show batches with available quantity
      setBatches((response.data || []).filter((b) => b.quantity > 0));
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }, []);
  useEffect(() => {
    fetchSales();
    fetchBatches();
  }, [fetchSales, fetchBatches]);

  const handleViewSale = async (sale: Sale) => {
    try {
      const response = await apiClient.get<Sale>(`/sales/${sale.id}`);
      setSelectedSale(response);
      setIsViewSheetOpen(true);
    } catch (err) {
      console.error('Failed to fetch sale details:', err);
    }
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      CASH: 'bg-green-100 text-green-800',
      CARD: 'bg-blue-100 text-blue-800',
      UPI: 'bg-purple-100 text-purple-800',
      CREDIT: 'bg-yellow-100 text-yellow-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  const handleSaleCreated = () => {
    fetchSales();
    fetchBatches();
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-gray-500 mt-2">Track and manage all sales transactions</p>
        </div>
        <Button
          onClick={() => setIsNewSaleOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-10 px-6"
        >
          <Plus className="h-5 w-5" />
          New Sale
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{sales.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by sale ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No sales found</p>
              <p className="text-sm text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first sale to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50">
                    <TableHead className="h-12">Sale ID</TableHead>
                    <TableHead className="h-12">Customer</TableHead>
                    <TableHead className="h-12 text-right">Amount</TableHead>
                    <TableHead className="h-12">Payment Method</TableHead>
                    <TableHead className="h-12">Items</TableHead>
                    <TableHead className="h-12">Date</TableHead>
                    <TableHead className="h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium">{sale.id.slice(0, 8)}</TableCell>
                      <TableCell>{sale.customer?.name || 'Offline Sale'}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        ₹{Number(sale.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} border-0`}>
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(sale.createdAt || sale.saleDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                          className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <NewSaleDialog
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSaleCreated={handleSaleCreated}
      />

      {/* View Sale Details Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sale Details</SheetTitle>
            <SheetDescription>{selectedSale?.id}</SheetDescription>
          </SheetHeader>

          {selectedSale && (
            <div className="space-y-6 mt-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Information</h3>
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{selectedSale.customer?.name || 'Offline Sale'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">{formatDateTime(selectedSale.createdAt || selectedSale.saleDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <Badge className={`${getPaymentMethodColor(selectedSale.paymentMethod)} border-0 mt-1`}>
                      {selectedSale.paymentMethod}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Items</h3>
                <div className="space-y-3">
                  {selectedSale.items?.map((item: SaleItem) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.drug?.brandName}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-emerald-600">
                        ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-emerald-600">₹{Number(selectedSale.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
