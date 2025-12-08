'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  AlertCircle,
  Receipt,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Sale, SaleItem, InventoryBatch, PaginatedResponse } from '@/lib/types';

interface CartItem {
  batchId: string;
  drugId: string;
  batch: InventoryBatch;
  quantity: number;
  unitPrice: number;
}

interface SaleFormData {
  paymentMethod: string;
  cashReceived: number;
}

const initialFormData: SaleFormData = {
  paymentMethod: 'CASH',
  cashReceived: 0,
};

const paymentMethods = ['CASH', 'CARD', 'UPI', 'CREDIT'];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setCart([]);
    setSelectedBatchId('');
    setItemQuantity(1);
    setError('');
    setIsDialogOpen(true);
  };

  const handleViewSale = async (sale: Sale) => {
    try {
      const response = await apiClient.get<Sale>(`/sales/${sale.id}`);
      setSelectedSale(response);
      setIsViewSheetOpen(true);
    } catch (err) {
      console.error('Failed to fetch sale details:', err);
    }
  };

  const addToCart = () => {
    if (!selectedBatchId) return;

    const batch = batches.find((b) => b.id === selectedBatchId);
    if (!batch) return;

    const existingItem = cart.find((item) => item.batchId === selectedBatchId);
    const totalQty = existingItem ? existingItem.quantity + itemQuantity : itemQuantity;

    if (totalQty > batch.quantity) {
      setError(`Only ${batch.quantity} units available`);
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.batchId === selectedBatchId ? { ...item, quantity: totalQty } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          batchId: selectedBatchId,
          drugId: batch.drugId,
          batch,
          quantity: itemQuantity,
          unitPrice: Number(batch.sellPrice),
        },
      ]);
    }

    setSelectedBatchId('');
    setItemQuantity(1);
    setError('');
  };

  const removeFromCart = (batchId: string) => {
    setCart(cart.filter((item) => item.batchId !== batchId));
  };

  const updateCartQuantity = (batchId: string, quantity: number) => {
    const item = cart.find((i) => i.batchId === batchId);
    if (!item) return;

    if (quantity > item.batch.quantity) {
      setError(`Only ${item.batch.quantity} units available`);
      return;
    }

    if (quantity <= 0) {
      removeFromCart(batchId);
      return;
    }

    setCart(cart.map((i) => (i.batchId === batchId ? { ...i, quantity } : i)));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getChangeGiven = () => {
    if (formData.paymentMethod !== 'CASH') return 0;
    const change = formData.cashReceived - getTotal();
    return change > 0 ? change : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Please add at least one item to the cart');
      return;
    }

    if (formData.paymentMethod === 'CASH' && formData.cashReceived < getTotal()) {
      setError('Cash received must be at least equal to the total amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        paymentMethod: formData.paymentMethod,
        cashReceived: formData.paymentMethod === 'CASH' ? formData.cashReceived : null,
        changeGiven: formData.paymentMethod === 'CASH' ? getChangeGiven() : null,
        items: cart.map((item) => ({
          drugId: item.drugId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await apiClient.post('/sales', payload);
      setIsDialogOpen(false);
      fetchSales();
      fetchBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
  };

  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.toLowerCase();
    return (
      sale.id.toLowerCase().includes(query) ||
      sale.paymentMethod.toLowerCase().includes(query) ||
      sale.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500">Manage sales and transactions</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold">
                  {formatCurrency(sales.reduce((sum, s) => sum + Number(s.totalAmount), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Sales</p>
                <p className="text-xl font-bold">
                  {
                    sales.filter(
                      (s) => new Date(s.saleDate).toDateString() === new Date().toDateString()
                    ).length
                  }
                </p>
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
              placeholder="Search by ID, payment method, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
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
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No sales found</p>
              <p className="text-sm">Create your first sale to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {sale.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDateTime(sale.saleDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50">
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.saleItems?.length || 0}</TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSale(sale)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
            <DialogDescription>Add items to cart and complete the sale</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 py-4 lg:grid-cols-2">
              {/* Left Column - Item Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Item</Label>
                  <div className="flex gap-2">
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.drug?.brandName} - {batch.batchNumber} ({batch.quantity} avail.)
                            - {formatCurrency(Number(batch.sellPrice))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button type="button" onClick={addToCart} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.paymentMethod === 'CASH' && (
                    <div className="space-y-2">
                      <Label>Cash Received</Label>
                      <Input
                        type="number"
                        min={getTotal()}
                        step="0.01"
                        value={formData.cashReceived || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cashReceived: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter cash received"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Cart */}
              <div className="space-y-4">
                <Label>Cart ({cart.length} items)</Label>
                <div className="rounded-lg border">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <ShoppingCart className="mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm">Cart is empty</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[250px]">
                      <div className="p-3 space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.batchId}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.batch.drug?.brandName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.batch.batchNumber} • {formatCurrency(item.unitPrice)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                max={item.batch.quantity}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartQuantity(item.batchId, parseInt(e.target.value) || 0)
                                }
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.batchId)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="w-24 text-right font-medium">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {cart.length > 0 && (
                    <div className="border-t p-3 space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-emerald-600">{formatCurrency(getTotal())}</span>
                      </div>
                      {formData.paymentMethod === 'CASH' && formData.cashReceived >= getTotal() && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Cash Received</span>
                            <span>{formatCurrency(formData.cashReceived)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span>Change</span>
                            <span>{formatCurrency(getChangeGiven())}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  `Complete Sale (${formatCurrency(getTotal())})`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sale Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Sale Details</SheetTitle>
            <SheetDescription>Sale ID: {selectedSale?.id.slice(0, 8)}...</SheetDescription>
          </SheetHeader>

          {selectedSale && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDateTime(selectedSale.saleDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <Badge variant="outline">{selectedSale.paymentMethod}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedSale.status)}
                </div>
                {selectedSale.cashReceived && (
                  <div>
                    <p className="text-sm text-gray-500">Cash Received</p>
                    <p className="font-medium">
                      {formatCurrency(Number(selectedSale.cashReceived))}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="mb-3 font-medium">Items</p>
                <div className="space-y-2">
                  {selectedSale.saleItems?.map((item: SaleItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.drug?.brandName || 'Unknown Drug'}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">
                    {formatCurrency(Number(selectedSale.totalAmount))}
                  </span>
                </div>
                {selectedSale.changeGiven && Number(selectedSale.changeGiven) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Change Given</span>
                    <span>{formatCurrency(Number(selectedSale.changeGiven))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
