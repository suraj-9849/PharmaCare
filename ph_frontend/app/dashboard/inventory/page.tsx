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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Edit,
  Trash2,
  Boxes,
  AlertCircle,
  AlertTriangle,
  Package,
  Download,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { exportInventoryToExcel, generateFilename } from '@/lib/excel-export';
import type { InventoryBatch, Drug, Supplier, PaginatedResponse } from '@/lib/types';

interface BatchFormData {
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  expiryDate: string;
  supplierId: string;
  location: string;
}

const initialFormData: BatchFormData = {
  drugId: '',
  batchNumber: '',
  quantity: 0,
  purchasePrice: 0,
  sellPrice: 0,
  expiryDate: '',
  supplierId: '',
  location: '',
};

export default function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<InventoryBatch>>('/inventory', {
        search: searchQuery || undefined,
        limit: 100,
      });
      setBatches((response as PaginatedResponse<InventoryBatch>).data || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const fetchDrugs = useCallback(async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<Drug>>('/drugs', { limit: 100 });
      setDrugs((response as PaginatedResponse<Drug>).data || []);
    } catch (err) {
      console.error('Failed to fetch drugs:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', {
        limit: 100,
      });
      setSuppliers((response as PaginatedResponse<Supplier>).data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
    fetchDrugs();
    fetchSuppliers();
  }, [fetchBatches, fetchDrugs, fetchSuppliers]);

  const handleOpenDialog = (batch?: InventoryBatch) => {
    if (batch) {
      setSelectedBatch(batch);
      setFormData({
        drugId: batch.drugId,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        purchasePrice: batch.purchasePrice,
        sellPrice: batch.sellPrice,
        expiryDate: batch.expiryDate.split('T')[0],
        supplierId: batch.supplierId || '',
        location: batch.location || '',
      });
    } else {
      setSelectedBatch(null);
      setFormData(initialFormData);
    }
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.drugId) {
      setError('Drug is required');
      return;
    }
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }
    if (!formData.expiryDate) {
      setError('Expiry date is required');
      return;
    }
    if (!formData.supplierId) {
      setError('Supplier is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedBatch) {
        await apiClient.put(`/inventory/${selectedBatch.id}`, formData);
      } else {
        await apiClient.post('/inventory', formData);
      }

      setIsDialogOpen(false);
      fetchBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;

    try {
      await apiClient.delete(`/inventory/${selectedBatch.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (err) {
      console.error('Failed to delete batch:', err);
    }
  };

  const getBatchStatus = (batch: InventoryBatch) => {
    const expiryDate = new Date(batch.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    if (batch.quantity <= 10) return 'low';
    return 'good';
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.drug?.brandName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    const status = getBatchStatus(batch);
    return matchesSearch && status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage inventory batches and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                setIsExporting(true);
                exportInventoryToExcel(batches, generateFilename('inventory'));
              } catch (error) {
                console.error('Failed to export inventory:', error);
                alert('Failed to export inventory to Excel');
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting || batches.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Batch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Boxes className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Batches</p>
                <p className="text-xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-bold">
                  {batches.filter((b) => getBatchStatus(b) === 'good').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-xl font-bold">
                  {batches.filter((b) => getBatchStatus(b) === 'expiring').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-xl font-bold">
                  {batches.filter((b) => getBatchStatus(b) === 'low').length}
                </p>
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
                placeholder="Search batches or drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="good">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
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
          ) : filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Boxes className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No batches found</p>
              <p className="text-sm">Add your first inventory batch to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const status = getBatchStatus(batch);
                    const daysUntilExpiry = Math.ceil(
                      (new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{batch.drug?.brandName}</p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'font-medium',
                              batch.quantity <= 10 ? 'text-red-600' : 'text-gray-900'
                            )}
                          >
                            {batch.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(batch.purchasePrice)}</TableCell>
                        <TableCell>{formatCurrency(batch.sellPrice)}</TableCell>
                        <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              status === 'expired' && 'border-red-200 bg-red-50 text-red-700',
                              status === 'expiring' &&
                                'border-amber-200 bg-amber-50 text-amber-700',
                              status === 'low' && 'border-orange-200 bg-orange-50 text-orange-700',
                              status === 'good' &&
                                'border-emerald-200 bg-emerald-50 text-emerald-700'
                            )}
                          >
                            {status === 'expired' && 'Expired'}
                            {status === 'expiring' && `${daysUntilExpiry}d left`}
                            {status === 'low' && 'Low Stock'}
                            {status === 'good' && 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(batch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedBatch(batch);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBatch ? 'Edit Batch' : 'Add New Batch'}</DialogTitle>
            <DialogDescription>
              {selectedBatch
                ? 'Update the batch information below'
                : 'Fill in the details to add a new inventory batch'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="drug">Drug *</Label>
                  <Select
                    value={formData.drugId}
                    onValueChange={(value) => setFormData({ ...formData, drugId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select drug" />
                    </SelectTrigger>
                    <SelectContent>
                      {drugs.map((drug) => (
                        <SelectItem key={drug.id} value={drug.id}>
                          {drug.brandName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number *</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="Enter batch number"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Selling Price *</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Shelf A, Row 2"
                />
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : selectedBatch ? (
                  'Update Batch'
                ) : (
                  'Add Batch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete batch &quot;{selectedBatch?.batchNumber}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
