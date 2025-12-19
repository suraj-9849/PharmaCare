'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertTriangle,
  Calendar,
  Package,
  AlertCircle,
  TrendingDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { InventoryBatch } from '@/lib/types';

interface ExpiringBatch extends InventoryBatch {
  daysUntilExpiry?: number;
  expiryStatus?: string;
}

export default function ExpiryPage() {
  const [batches, setBatches] = useState<ExpiringBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState<string>('30');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showDisposeDialog, setShowDisposeDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ExpiringBatch | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.smartShelf.getExpiringBatches({
        days: parseInt(daysFilter) || 30,
        limit: 200,
      });
      setBatches((response.data as ExpiringBatch[]) || []);
    } catch (err) {
      console.error('Failed to fetch expiring batches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [daysFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusColor = (daysLeft: number) => {
    if (daysLeft <= 0)
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        badge: 'bg-red-100 text-red-700 border-red-200',
      };
    if (daysLeft <= 7)
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    if (daysLeft <= 14)
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
      };
    return {
      bg: 'bg-yellow-500',
      text: 'text-white',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
  };

  const filteredBatches = batches
    .filter((batch) => {
      const matchesSearch =
        batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.drug?.brandName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      const daysA = a.daysUntilExpiry ?? getDaysUntilExpiry(a.expiryDate);
      const daysB = b.daysUntilExpiry ?? getDaysUntilExpiry(b.expiryDate);
      return daysA - daysB;
    });

  const expiredCount = batches.filter(
    (b) => (b.daysUntilExpiry ?? getDaysUntilExpiry(b.expiryDate)) <= 0
  ).length;
  const expiringWeekCount = batches.filter((b) => {
    const days = b.daysUntilExpiry ?? getDaysUntilExpiry(b.expiryDate);
    return days > 0 && days <= 7;
  }).length;
  const expiringMonthCount = batches.filter((b) => {
    const days = b.daysUntilExpiry ?? getDaysUntilExpiry(b.expiryDate);
    return days > 7 && days <= 30;
  }).length;

  const currentBatch = filteredBatches[currentIndex];
  const daysLeft = currentBatch
    ? (currentBatch.daysUntilExpiry ?? getDaysUntilExpiry(currentBatch.expiryDate))
    : 0;

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(filteredBatches.length - 1, prev + 1));
  };

  const openDiscountDialog = (batch: ExpiringBatch) => {
    setSelectedBatch(batch);
    setDiscountPercentage('');
    setShowDiscountDialog(true);
  };

  const openDisposeDialog = (batch: ExpiringBatch) => {
    setSelectedBatch(batch);
    setShowDisposeDialog(true);
  };

  const handleDiscount = async () => {
    if (!selectedBatch || !discountPercentage) return;

    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      alert('Please enter a valid discount percentage between 1 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const originalPrice = Number(selectedBatch.sellPrice);
      const discountedPrice = originalPrice * (1 - discount / 100);

      // Update batch with discounted price
      await apiClient.inventory.update(selectedBatch.id, {
        sellPrice: discountedPrice.toFixed(2),
      });

      // Record the expiry action
      await apiClient.smartShelf.recordExpiryAction({
        batchId: selectedBatch.id,
        action: 'DISCOUNT',
        quantity: selectedBatch.quantity,
        discountAmount: (originalPrice - discountedPrice) * selectedBatch.quantity,
        reason: `${discount}% discount applied due to approaching expiry`,
        notes: `Original price: ${formatCurrency(originalPrice)}, Discounted price: ${formatCurrency(discountedPrice)}`,
      });

      alert(
        `Discount of ${discount}% applied successfully! New price: ${formatCurrency(discountedPrice)}`
      );
      setShowDiscountDialog(false);
      setSelectedBatch(null);
      setDiscountPercentage('');

      // Refresh data
      await fetchBatches();

      // Move to next batch if available
      if (currentIndex < filteredBatches.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err) {
      console.error('Error applying discount:', err);
      alert(err instanceof Error ? err.message : 'Failed to apply discount');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispose = async () => {
    if (!selectedBatch) return;

    setIsSaving(true);
    try {
      // Record the disposal action first
      await apiClient.smartShelf.recordExpiryAction({
        batchId: selectedBatch.id,
        action: 'DISPOSE',
        quantity: selectedBatch.quantity,
        reason: 'Expired or near expiry - disposed according to regulations',
        notes: `Batch ${selectedBatch.batchNumber} disposed`,
      });

      // Delete the batch from inventory
      await apiClient.inventory.delete(selectedBatch.id);

      alert('Batch disposed successfully!');
      setShowDisposeDialog(false);
      setSelectedBatch(null);

      // Refresh data
      await fetchBatches();

      // Adjust current index
      if (currentIndex >= filteredBatches.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err) {
      console.error('Error disposing batch:', err);
      alert(err instanceof Error ? err.message : 'Failed to dispose batch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturnToVendor = async (batch: ExpiringBatch) => {
    if (!confirm(`Return batch ${batch.batchNumber} to vendor?`)) return;

    try {
      await apiClient.smartShelf.recordExpiryAction({
        batchId: batch.id,
        action: 'RETURN_TO_VENDOR',
        quantity: batch.quantity,
        vendorReturn: true,
        reason: 'Returned to vendor before expiry',
        notes: `Batch ${batch.batchNumber} returned to ${batch.supplier?.supplierName || 'supplier'}`,
      });

      // Delete the batch after recording the return
      await apiClient.inventory.delete(batch.id);

      alert('Batch marked for return to vendor!');
      await fetchBatches();

      if (currentIndex >= filteredBatches.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err) {
      console.error('Error returning to vendor:', err);
      alert(err instanceof Error ? err.message : 'Failed to process return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expiry Management</h1>
          <p className="text-gray-500">Manage products approaching expiration with smart actions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Expired</p>
                <p className="text-3xl font-bold text-red-700">{expiredCount}</p>
                <p className="text-xs text-red-500 mt-1">Immediate action required</p>
              </div>
              <div className="rounded-full bg-red-500 p-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Expiring in 7 Days</p>
                <p className="text-3xl font-bold text-amber-700">{expiringWeekCount}</p>
                <p className="text-xs text-amber-500 mt-1">Take action soon</p>
              </div>
              <div className="rounded-full bg-amber-500 p-3">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Expiring in 30 Days</p>
                <p className="text-3xl font-bold text-yellow-700">{expiringMonthCount}</p>
                <p className="text-xs text-yellow-500 mt-1">Monitor closely</p>
              </div>
              <div className="rounded-full bg-yellow-500 p-3">
                <Calendar className="h-6 w-6 text-white" />
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
                placeholder="Search by batch number or product name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentIndex(0); // Reset to first item when searching
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={daysFilter}
              onValueChange={(val) => {
                setDaysFilter(val);
                setCurrentIndex(0);
              }}
            >
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

      {/* Card-based Swipe Interface */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-64 w-full max-w-md rounded-xl" />
              <Skeleton className="h-10 w-48" />
            </div>
          </CardContent>
        </Card>
      ) : filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Package className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-xl font-medium">No expiring products found</p>
            <p className="text-sm">All batches are within safe expiry range</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Card Display */}
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-2 shadow-lg">
              <CardHeader className={cn('rounded-t-lg', getExpiryStatusColor(daysLeft).bg)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className={cn('text-2xl', getExpiryStatusColor(daysLeft).text)}>
                      {currentBatch?.drug?.brandName || 'Unknown Product'}
                    </CardTitle>
                    <CardDescription
                      className={cn(
                        'text-base mt-1',
                        getExpiryStatusColor(daysLeft).text,
                        'opacity-90'
                      )}
                    >
                      {currentBatch?.drug?.genericName || currentBatch?.drug?.category}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-sm px-3 py-1', getExpiryStatusColor(daysLeft).badge)}
                  >
                    {daysLeft <= 0
                      ? 'EXPIRED'
                      : daysLeft === 1
                        ? '1 DAY LEFT'
                        : `${daysLeft} DAYS LEFT`}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Batch Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Batch Number</p>
                    <p className="font-mono font-semibold text-lg">{currentBatch?.batchNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold text-lg">{currentBatch?.quantity} units</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatCurrency(Number(currentBatch?.sellPrice))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatCurrency(
                        (currentBatch?.quantity || 0) * Number(currentBatch?.sellPrice || 0)
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-semibold text-lg text-red-600">
                      {formatDate(currentBatch?.expiryDate || '')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-semibold text-lg truncate">
                      {currentBatch?.supplier?.supplierName || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Location Info */}
                {currentBatch?.shelfLocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Shelf Location</p>
                    <p className="text-blue-900 font-semibold">
                      {currentBatch.shelfLocation.shelfCode} -{' '}
                      {currentBatch.shelfLocation.shelfName}
                      {currentBatch.slotPosition && ` (Slot ${currentBatch.slotPosition})`}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <Button
                    onClick={() => handleReturnToVendor(currentBatch!)}
                    variant="outline"
                    className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return
                  </Button>
                  <Button
                    onClick={() => openDiscountDialog(currentBatch!)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Discount
                  </Button>
                  <Button
                    onClick={() => openDisposeDialog(currentBatch!)}
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Dispose
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Batch {currentIndex + 1} of {filteredBatches.length}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === filteredBatches.length - 1}
              className="h-12 w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Apply Discount
            </DialogTitle>
            <DialogDescription>
              Set a discount percentage for batch {selectedBatch?.batchNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage</Label>
              <div className="relative">
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter discount % (e.g., 20)"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {discountPercentage && selectedBatch && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Original Price:</span>
                  <span className="font-semibold">
                    {formatCurrency(Number(selectedBatch.sellPrice))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount Amount:</span>
                  <span className="font-semibold text-green-600">
                    -
                    {formatCurrency(
                      Number(selectedBatch.sellPrice) * (parseFloat(discountPercentage) / 100)
                    )}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2 flex justify-between">
                  <span className="font-medium">New Price:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(
                      Number(selectedBatch.sellPrice) * (1 - parseFloat(discountPercentage) / 100)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiscountDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleDiscount} disabled={isSaving || !discountPercentage}>
              {isSaving ? 'Applying...' : 'Apply Discount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Dialog */}
      <Dialog open={showDisposeDialog} onOpenChange={setShowDisposeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Dispose Batch
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The batch will be permanently removed from inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="font-medium text-red-900">Batch Details:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-semibold">{selectedBatch?.drug?.brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Batch Number:</span>
                <span className="font-mono font-semibold">{selectedBatch?.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{selectedBatch?.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Value Loss:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    (selectedBatch?.quantity || 0) * Number(selectedBatch?.sellPrice || 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisposeDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDispose} disabled={isSaving}>
              {isSaving ? 'Disposing...' : 'Confirm Disposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
