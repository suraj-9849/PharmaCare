'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type {
  ShelfLocation,
  InventoryBatch,
  IncorrectPickAlert,
  ShelfAnalytics,
  ExpiryActionType,
  Drug,
  Supplier,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Icons
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  Archive,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trash2,
  Percent,
  CheckCircle2,
  Grid3x3,
  Zap,
  Edit,
  Box,
  Loader2,
  Pill,
} from 'lucide-react';

export default function SmartShelfPage() {
  // State
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [analytics, setAnalytics] = useState<ShelfAnalytics | null>(null);
  const [expiringBatches, setExpiringBatches] = useState<InventoryBatch[]>([]);
  const [currentSwipeBatchIndex, setCurrentSwipeBatchIndex] = useState(0);
  const [alerts, setAlerts] = useState<IncorrectPickAlert[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddShelfDialog, setShowAddShelfDialog] = useState(false);
  const [showEditShelfDialog, setShowEditShelfDialog] = useState(false);
  const [showViewShelfDialog, setShowViewShelfDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<IncorrectPickAlert | null>(null);
  const [viewingShelf, setViewingShelf] = useState<ShelfLocation | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<ShelfLocation | null>(null);
  const [editingShelf, setEditingShelf] = useState<ShelfLocation | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [showBatchDetailsDialog, setShowBatchDetailsDialog] = useState(false);
  const [showConfigureBatchDialog, setShowConfigureBatchDialog] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };
  const [configuringSlot, setConfiguringSlot] = useState<{
    slotNumber: number;
    shelfId: string;
    existingBatch?: InventoryBatch;
  } | null>(null);
  const [drugs, setDrugs] = useState<{ id: string; brand_name: string; generic_name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; contactEmail?: string }[]>(
    []
  );
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showDisposeDialog, setShowDisposeDialog] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    shelfCode: '',
    shelfName: '',
    zone: 'General',
    capacity: 15,
    rows: 3,
    columns: 5,
    status: 'ACTIVE',
    notes: '',
  });

  const [batchFormData, setBatchFormData] = useState({
    drugId: '',
    batchNumber: '',
    quantity: 0,
    purchasePrice: 0,
    sellPrice: 0,
    expiryDate: '',
    supplierId: '',
    location: '',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [shelvesRes, analyticsRes, alertsRes, drugsRes, suppliersRes] = await Promise.all([
          apiClient.smartShelf.getAllShelves({ limit: 100 }),
          apiClient.smartShelf.getAnalytics(),
          apiClient.smartShelf.getUnacknowledgedAlerts(50),
          apiClient.drugs.getAll(1, 200),
          apiClient.suppliers.getAll(1, 100),
        ]);

        const shelvesData = (shelvesRes.data as ShelfLocation[]) || [];

        // Handle PaginatedResponse (has .data as T[])
        setShelves(shelvesData);
        setDrugs(
          ((drugsRes.data as Drug[]) || []).map((drug) => ({
            id: drug.id,
            brand_name: drug.brandName || '',
            generic_name: drug.genericName || '',
          }))
        );
        setSuppliers(
          ((suppliersRes.data as Supplier[]) || []).map((supplier) => ({
            id: supplier.id,
            name: supplier.name || '',
            contactEmail: supplier.email,
          }))
        );

        // Extract expiring batches directly from shelves data
        // Backend already provides daysUntilExpiry for each batch
        const allBatches: InventoryBatch[] = [];
        shelvesData.forEach((shelf) => {
          if (shelf.batches && shelf.batches.length > 0) {
            shelf.batches.forEach((batch) => {
              // Use backend's daysUntilExpiry - include items expiring within 30 days or already expired
              const daysUntilExpiry =
                batch.daysUntilExpiry ??
                Math.ceil(
                  (new Date(batch.expiryDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

              if (daysUntilExpiry <= 30 && batch.quantity > 0) {
                allBatches.push({
                  ...batch,
                  daysUntilExpiry,
                  shelfLocation: shelf,
                } as InventoryBatch);
              }
            });
          }
        });

        // Sort by expiry date (soonest/most urgent first)
        allBatches.sort((a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999));
        setExpiringBatches(allBatches);

        console.log('Shelves loaded:', shelvesData.length);
        console.log('Expiring batches extracted:', allBatches.length);

        // Handle ApiResponse (has .data as single object or array)
        setAnalytics((analyticsRes.data as ShelfAnalytics) || null);
        setAlerts(
          (Array.isArray(alertsRes.data) ? (alertsRes.data as IncorrectPickAlert[]) : []) || []
        );
      } catch (error) {
        console.error('Error fetching smart shelf data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create shelf
  const handleCreateShelf = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.smartShelf.createShelf({
        shelfCode: formData.shelfCode,
        shelfName: formData.shelfName,
        zone: formData.zone,
        capacity: formData.capacity,
        row: String(formData.rows),
        column: String(formData.columns),
        status: formData.status,
        notes: formData.zone === 'Refrigerated' ? formData.notes : undefined,
      });

      const newShelf = response.data as ShelfLocation;
      setShelves([
        ...shelves,
        { ...newShelf, batches: [], currentStock: 0, utilizationPercentage: 0 },
      ]);
      setShowAddShelfDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error creating shelf:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to create shelf', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Update shelf
  const handleUpdateShelf = async () => {
    if (!editingShelf) return;
    setIsSaving(true);
    try {
      const response = await apiClient.smartShelf.updateShelf(editingShelf.id, {
        shelfCode: formData.shelfCode,
        shelfName: formData.shelfName,
        zone: formData.zone,
        capacity: formData.capacity,
        row: String(formData.rows),
        column: String(formData.columns),
        status: formData.status,
        notes: formData.zone === 'Refrigerated' ? formData.notes : undefined,
      });

      const updatedShelf = response.data as ShelfLocation;
      setShelves(
        shelves.map((s) =>
          s.id === editingShelf.id
            ? {
                ...updatedShelf,
                batches: s.batches,
                currentStock: s.currentStock,
                utilizationPercentage: s.utilizationPercentage,
              }
            : s
        )
      );
      setShowEditShelfDialog(false);
      setEditingShelf(null);
      resetForm();
    } catch (err) {
      console.error('Error updating shelf:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to update shelf', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete shelf
  const handleDeleteShelf = async (force: boolean = false) => {
    if (!shelfToDelete) return;
    try {
      await apiClient.smartShelf.deleteShelf(shelfToDelete.id, force);
      setShelves(shelves.filter((s) => s.id !== shelfToDelete.id));
      setShowDeleteConfirm(false);
      setShelfToDelete(null);
      showNotification(
        force ? 'Shelf and all batches deleted successfully' : 'Shelf deleted successfully'
      );
    } catch (err) {
      console.error('Error deleting shelf:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to delete shelf', 'error');
    }
  };

  const openShelfDetails = async (shelf: ShelfLocation) => {
    try {
      // Fetch full shelf details with batches
      const response = await apiClient.smartShelf.getShelfById(shelf.id);
      const fullShelf = response.data as ShelfLocation;
      setViewingShelf(fullShelf);
      setShowViewShelfDialog(true);
    } catch (err) {
      console.error('Error fetching shelf details:', err);
      // Fallback to local data if API fails
      setViewingShelf(shelf);
      setShowViewShelfDialog(true);
    }
  };

  const handleSlotClick = (
    batch: InventoryBatch | undefined,
    slotNumber?: number,
    shelfId?: string
  ) => {
    if (batch) {
      // If clicking on filled slot, show details AND allow editing
      setSelectedBatch(batch);
      setShowBatchDetailsDialog(true);
    } else if (slotNumber && shelfId) {
      // If clicking on empty slot, show configure dialog
      setConfiguringSlot({ slotNumber, shelfId });
      setBatchFormData({
        drugId: '',
        batchNumber: `B${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: 50,
        purchasePrice: 0,
        sellPrice: 0,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        supplierId: '',
        location: '',
      });
      setShowConfigureBatchDialog(true);
    }
  };

  const openEditBatch = (batch: InventoryBatch) => {
    setConfiguringSlot({
      slotNumber: batch.slotPosition || 0,
      shelfId: batch.shelfLocationId || '',
      existingBatch: batch,
    });
    setBatchFormData({
      drugId: batch.drugId,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice,
      sellPrice: batch.sellPrice,
      expiryDate: new Date(batch.expiryDate).toISOString().split('T')[0],
      supplierId: batch.supplierId || '',
      location: batch.location || '',
    });
    setShowBatchDetailsDialog(false);
    setShowConfigureBatchDialog(true);
  };

  const handleSaveBatch = async () => {
    if (!configuringSlot) return;

    setIsSaving(true);
    try {
      // Convert empty strings to null for optional foreign key fields
      const dataToSend = {
        ...batchFormData,
        expiryDate: new Date(batchFormData.expiryDate).toISOString(),
        supplierId: batchFormData.supplierId || null,
        location: batchFormData.location || null,
      };

      if (configuringSlot.existingBatch) {
        // Update existing batch
        console.log('Updating batch:', configuringSlot.existingBatch.id, dataToSend);
        const response = await apiClient.inventory.update(
          configuringSlot.existingBatch.id,
          dataToSend
        );
        console.log('Update response:', response);
        showNotification('Batch updated successfully!');
      } else {
        // Create new batch and assign to slot
        const createData = {
          ...dataToSend,
          shelfLocationId: configuringSlot.shelfId,
          slotPosition: configuringSlot.slotNumber,
        };
        console.log('Creating batch with data:', createData);
        const response = await apiClient.inventory.create(createData);
        console.log('Create response:', response);
        showNotification('Batch added to slot successfully!');
      }

      // Refresh shelf details
      if (viewingShelf) {
        console.log('Refreshing shelf:', viewingShelf.id);
        const shelfResponse = await apiClient.smartShelf.getShelfById(viewingShelf.id);
        console.log('Shelf refresh response:', shelfResponse.data);
        setViewingShelf(shelfResponse.data as ShelfLocation);
      }

      // Refresh shelves list
      const shelvesResponse = await apiClient.smartShelf.getAllShelves({ limit: 100 });
      setShelves((shelvesResponse.data as ShelfLocation[]) || []);

      setShowConfigureBatchDialog(false);
      setConfiguringSlot(null);
    } catch (err) {
      console.error('Error saving batch:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to save batch', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditShelf = (shelf: ShelfLocation) => {
    setEditingShelf(shelf);
    setFormData({
      shelfCode: shelf.shelfCode,
      shelfName: shelf.shelfName,
      zone: shelf.zone || 'General',
      capacity: shelf.capacity || 15,
      rows: parseInt(shelf.row || '3'),
      columns: parseInt(shelf.column || '5'),
      status: shelf.status || 'ACTIVE',
      notes: shelf.notes || '',
    });
    setShowEditShelfDialog(true);
  };

  const resetForm = () => {
    setFormData({
      shelfCode: '',
      shelfName: '',
      zone: 'General',
      capacity: 15,
      rows: 3,
      columns: 5,
      status: 'ACTIVE',
      notes: '',
    });
  };

  // Swipe logic
  const currentBatch = expiringBatches[currentSwipeBatchIndex];

  const handleSwipe = async (action: ExpiryActionType) => {
    if (!currentBatch) return;

    // Show dialog for discount or dispose
    if (action === 'DISCOUNT') {
      setShowDiscountDialog(true);
      return;
    }

    if (action === 'DISPOSE') {
      setShowDisposeDialog(true);
      return;
    }

    // For return to vendor, process immediately
    try {
      setIsProcessingAction(true);
      await apiClient.smartShelf.recordExpiryAction({
        batchId: currentBatch.id,
        action,
        quantity: currentBatch.quantity,
        vendorReturn: action === 'RETURN_TO_VENDOR',
        reason: `${action} via Smart Shelf`,
      });

      // Move to next batch
      await moveToNextBatch();
    } catch (err) {
      console.error('Error recording expiry action:', err);
      showNotification('Failed to record action. Please try again.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const moveToNextBatch = async (removeCurrent: boolean = false) => {
    // Remove current batch from list if action was taken
    if (removeCurrent && currentBatch) {
      const updatedBatches = expiringBatches.filter((b) => b.id !== currentBatch.id);
      setExpiringBatches(updatedBatches);

      // Adjust index if needed
      if (currentSwipeBatchIndex >= updatedBatches.length) {
        setCurrentSwipeBatchIndex(Math.max(0, updatedBatches.length - 1));
      }

      // Refresh shelves to reflect changes
      const shelvesRes = await apiClient.smartShelf.getAllShelves({ limit: 100 });
      const shelvesData = (shelvesRes.data as ShelfLocation[]) || [];
      setShelves(shelvesData);

      // Refresh analytics
      const analyticsRes = await apiClient.smartShelf.getAnalytics();
      setAnalytics((analyticsRes.data as ShelfAnalytics) || null);

      return;
    }

    // Move to next batch if available
    if (currentSwipeBatchIndex < expiringBatches.length - 1) {
      setCurrentSwipeBatchIndex(currentSwipeBatchIndex + 1);
    } else {
      // Refresh the shelves and extract expiring batches again
      const shelvesRes = await apiClient.smartShelf.getAllShelves({ limit: 100 });
      const shelvesData = (shelvesRes.data as ShelfLocation[]) || [];
      setShelves(shelvesData);

      // Extract expiring batches from shelves data - same logic as initial fetch
      const allBatches: InventoryBatch[] = [];
      shelvesData.forEach((shelf) => {
        if (shelf.batches && shelf.batches.length > 0) {
          shelf.batches.forEach((batch) => {
            const daysUntilExpiry =
              batch.daysUntilExpiry ??
              Math.ceil(
                (new Date(batch.expiryDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

            if (daysUntilExpiry <= 30 && batch.quantity > 0) {
              allBatches.push({
                ...batch,
                daysUntilExpiry,
                shelfLocation: shelf,
              } as InventoryBatch);
            }
          });
        }
      });

      allBatches.sort((a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999));
      setExpiringBatches(allBatches);
      setCurrentSwipeBatchIndex(0);
    }
  };

  const handleApplyDiscount = async () => {
    if (!currentBatch || discountPercentage <= 0 || discountPercentage > 100) {
      showNotification('Please enter a valid discount percentage (1-100)', 'error');
      return;
    }

    try {
      setIsProcessingAction(true);
      const currentSellPrice = currentBatch.sellPrice;
      const newSellPrice = currentSellPrice * (1 - discountPercentage / 100);

      // Update batch with new discounted price - item stays in inventory
      await apiClient.inventory.update(currentBatch.id, {
        sellPrice: parseFloat(newSellPrice.toFixed(2)),
      });

      // Record expiry action
      await apiClient.smartShelf.recordExpiryAction({
        batchId: currentBatch.id,
        action: 'DISCOUNT',
        quantity: currentBatch.quantity,
        vendorReturn: false,
        reason: `Applied ${discountPercentage}% discount. Original price: ${formatCurrency(currentSellPrice)}, New price: ${formatCurrency(newSellPrice)}`,
      });

      // Close dialog and reset
      setShowDiscountDialog(false);
      setDiscountPercentage(0);

      // Show success message
      showNotification(
        `Discount applied! New price: ${formatCurrency(newSellPrice)} (was ${formatCurrency(currentSellPrice)})`
      );

      // Just remove from expiring alerts list (UI only), keep in database
      // The item is now "pushed" to sales with discount
      const updatedBatches = expiringBatches.filter((b) => b.id !== currentBatch.id);
      setExpiringBatches(updatedBatches);

      if (currentSwipeBatchIndex >= updatedBatches.length) {
        setCurrentSwipeBatchIndex(Math.max(0, updatedBatches.length - 1));
      }

      // Refresh shelves to reflect updated price in shelf slots
      const shelvesRes = await apiClient.smartShelf.getAllShelves({ limit: 100 });
      const shelvesData = (shelvesRes.data as ShelfLocation[]) || [];
      setShelves(shelvesData);
    } catch (err) {
      console.error('Error applying discount:', err);
      showNotification('Failed to apply discount. Please try again.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDisposeBatch = async () => {
    if (!currentBatch) return;

    try {
      setIsProcessingAction(true);

      // Record disposal action (for tracking purposes only)
      await apiClient.smartShelf.recordExpiryAction({
        batchId: currentBatch.id,
        action: 'DISPOSE',
        quantity: currentBatch.quantity,
        vendorReturn: false,
        reason: 'Marked for disposal via Smart Shelf expiry review',
      });

      // NOTE: We do NOT delete or modify the batch data - it stays in the shelf
      // We only remove it from the expiring items alert list (UI only)

      // Close dialog
      setShowDisposeDialog(false);

      // Show success message
      showNotification(
        `${currentBatch.drug?.brandName || 'Batch'} removed from expiry alerts. Item remains in shelf.`
      );

      // Remove from expiring alerts list (UI only) - data stays in database
      const updatedBatches = expiringBatches.filter((b) => b.id !== currentBatch.id);
      setExpiringBatches(updatedBatches);

      if (currentSwipeBatchIndex >= updatedBatches.length) {
        setCurrentSwipeBatchIndex(Math.max(0, updatedBatches.length - 1));
      }

      // Note: No shelf refresh needed since we didn't modify any shelf data
    } catch (err) {
      console.error('Error disposing batch:', err);
      showNotification('Failed to dispose batch. Please try again.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.smartShelf.acknowledgeAlert(alertId);
      setAlerts(alerts.filter((a) => a.id !== alertId));
      setShowAlertModal(false);
      setCurrentAlert(null);
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const getExpiryStatusBadge = (daysUntilExpiry?: number) => {
    if (!daysUntilExpiry) return null;

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive">{daysUntilExpiry}d left (Urgent)</Badge>;
    } else if (daysUntilExpiry <= 14) {
      return <Badge className="bg-orange-600">{daysUntilExpiry}d left (Critical)</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-amber-600">{daysUntilExpiry}d left</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-[1600px] mx-auto px-6  space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/8 to-violet-600/8 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between p-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Intelligent Shelf Management
                  </h1>
                </div>
                <p className="text-sm text-slate-600 font-medium ml-[52px]">
                  Enterprise-grade inventory tracking with real-time analytics and FEFO compliance
                </p>
              </div>
              <Button
                onClick={() => setShowAddShelfDialog(true)}
                size="lg"
                className="gap-2 h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/35 hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Add New Shelf
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
              <h2 className="text-lg font-bold text-slate-900">Performance Metrics</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/30 hover:shadow-xl hover:border-blue-300/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] to-transparent" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Total Shelves
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 transition-all shadow-sm">
                    <Package className="h-5 w-5 text-blue-700" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {analytics.totalShelves}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    {analytics.activeShelves} active locations
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-indigo-50/30 hover:shadow-xl hover:border-indigo-300/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/[0.03] to-transparent" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Active Batches
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all shadow-sm">
                    <Archive className="h-5 w-5 text-indigo-700" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {analytics.totalBatchesOnShelf}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">Across all shelves</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-orange-50/20 to-orange-50/40 hover:shadow-xl hover:border-orange-300/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/[0.03] to-transparent" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Expiring Soon
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 group-hover:from-orange-200 group-hover:to-orange-100 transition-all shadow-sm">
                    <Clock className="h-5 w-5 text-orange-700" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-orange-700 mb-1">
                    {analytics.expiringCount}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">Within 30 days</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-red-50/20 to-red-50/40 hover:shadow-xl hover:border-red-300/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/[0.03] to-transparent" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    FEFO Alerts
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-50 group-hover:from-red-200 group-hover:to-red-100 transition-all shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-red-700" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-red-700 mb-1">
                    {analytics.incorrectPickCount}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">Violations pending</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 hover:shadow-xl hover:border-emerald-300/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/[0.03] to-transparent" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Utilization
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 group-hover:from-emerald-200 group-hover:to-emerald-100 transition-all shadow-sm">
                    <TrendingUp className="h-5 w-5 text-emerald-700" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-emerald-700 mb-1">
                    {analytics.topUtilizedShelves?.[0]?.utilizationPercentage?.toFixed(0) || 0}%
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    {analytics.topUtilizedShelves?.[0]?.shelfCode || 'No data'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30 overflow-hidden">
          <Tabs defaultValue="shelves" className="w-full">
            <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white px-8 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                <h2 className="text-lg font-bold text-slate-900">Inventory Overview</h2>
              </div>
              <TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-100/80 p-1.5 rounded-xl mb-6">
                <TabsTrigger
                  value="shelves"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold"
                >
                  <Grid3x3 className="h-4 w-4" />
                  All Shelves
                </TabsTrigger>
                <TabsTrigger
                  value="swipe"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold"
                >
                  <Zap className="h-4 w-4" />
                  Expiring Items
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold"
                >
                  <AlertTriangle className="h-4 w-4" />
                  FEFO Alerts
                  {alerts.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {alerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Shelves Tab */}
            <TabsContent value="shelves" className="p-8 pt-6">
              {shelves.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:border-blue-300 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center py-20">
                    <div className="p-5 rounded-2xl bg-slate-100 mb-5">
                      <Grid3x3 className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      No Shelves Created Yet
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
                      Create your first shelf location to start tracking inventory with intelligent
                      organization
                    </p>
                    <Button
                      onClick={() => setShowAddShelfDialog(true)}
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30"
                    >
                      <Plus className="h-5 w-5" />
                      Create First Shelf
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {shelves.map((shelf) => {
                    const util = Math.round(shelf.utilizationPercentage || 0);
                    const filledSlots = shelf.currentStock || 0;
                    const totalSlots = shelf.capacity || 0;
                    const availableSlots = totalSlots - filledSlots;

                    return (
                      <Card
                        key={shelf.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col"
                        onClick={() => openShelfDetails(shelf)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {shelf.shelfName}
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {shelf.shelfCode} • {shelf.row}×{shelf.column}
                              </CardDescription>
                            </div>
                            {shelf.status === 'ACTIVE' && (
                              <Badge
                                variant="default"
                                className="bg-emerald-600 text-xs flex-shrink-0"
                              >
                                <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-300 mr-1.5">
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 animate-pulse"></span>
                                </span>
                                Active
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                          {/* Main Utilization */}
                          <div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="text-4xl font-bold">{util}</span>
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                              Capacity
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-1.5 w-full rounded-full overflow-hidden bg-secondary">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${util}%` }}
                            />
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="p-2 rounded bg-slate-50">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Occupied
                              </p>
                              <p className="text-2xl font-bold leading-tight mt-0.5">
                                {filledSlots}
                              </p>
                            </div>
                            <div className="p-2 rounded bg-blue-50">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Available
                              </p>
                              <p className="text-2xl font-bold text-blue-600 leading-tight mt-0.5">
                                {availableSlots}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Expiring Items Tab */}
            <TabsContent value="swipe" className="p-6">
              {expiringBatches.length === 0 ? (
                <Card className="border border-slate-200">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">All Clear</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      No items require attention. All inventory is within safe expiry range.
                    </p>
                  </CardContent>
                </Card>
              ) : currentBatch ? (
                <div className="space-y-6">
                  {/* Top Bar - Progress & Stats */}
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Review Progress</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {currentSwipeBatchIndex + 1} / {expiringBatches.length}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-slate-900 transition-all duration-500"
                          style={{
                            width: `${((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCurrentSwipeBatchIndex(Math.max(0, currentSwipeBatchIndex - 1))
                        }
                        disabled={currentSwipeBatchIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCurrentSwipeBatchIndex(
                            Math.min(expiringBatches.length - 1, currentSwipeBatchIndex + 1)
                          )
                        }
                        disabled={currentSwipeBatchIndex === expiringBatches.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Main Content */}
                  <Card className="border border-slate-200 overflow-hidden">
                    {/* Header with Drug Info */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {currentBatch.drug?.brandName || 'Unknown Drug'}
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">
                            {currentBatch.drug?.genericName}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="font-mono">
                              {currentBatch.batchNumber}
                            </Badge>
                            {currentBatch.shelfLocation && (
                              <Badge variant="secondary">
                                {currentBatch.shelfLocation.shelfCode} • Slot{' '}
                                {currentBatch.slotPosition}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getExpiryStatusBadge(currentBatch.daysUntilExpiry ?? 0)}
                          <p className="text-xs text-slate-500 mt-2">
                            {(currentBatch.daysUntilExpiry ?? 0) < 0
                              ? `Expired ${Math.abs(currentBatch.daysUntilExpiry ?? 0)} days ago`
                              : `Expires in ${currentBatch.daysUntilExpiry ?? 0} days`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Quantity
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {currentBatch.quantity}
                          </p>
                          <p className="text-xs text-slate-500">units</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Unit Price
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(currentBatch.sellPrice)}
                          </p>
                          <p className="text-xs text-slate-500">per unit</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Total Value
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(currentBatch.sellPrice * currentBatch.quantity)}
                          </p>
                          <p className="text-xs text-slate-500">at risk</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Expiry Date
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {formatDate(new Date(currentBatch.expiryDate))}
                          </p>
                          <p className="text-xs text-slate-500">
                            {currentBatch.shelfLocation?.shelfName || 'Unknown shelf'}
                          </p>
                        </div>
                      </div>

                      {/* Supplier Info */}
                      {currentBatch.supplier && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Supplier
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {currentBatch.supplier.name}
                          </p>
                          {(currentBatch.supplier as Supplier).email && (
                            <p className="text-xs text-slate-500">
                              {(currentBatch.supplier as Supplier).email}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                        Take Action
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          onClick={() => handleSwipe('RETURN_TO_VENDOR')}
                          disabled={isProcessingAction}
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                        >
                          <ArrowRight className="h-5 w-5" />
                          <span className="font-semibold">Return to Vendor</span>
                          <span className="text-xs text-muted-foreground">
                            Get refund or credit
                          </span>
                        </Button>

                        <Button
                          onClick={() => handleSwipe('DISCOUNT')}
                          disabled={isProcessingAction}
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                        >
                          <Percent className="h-5 w-5" />
                          <span className="font-semibold">Discount & Push</span>
                          <span className="text-xs text-muted-foreground">
                            Reduce price to sell
                          </span>
                        </Button>

                        <Button
                          onClick={() => handleSwipe('DISPOSE')}
                          disabled={isProcessingAction}
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="font-semibold">Dispose</span>
                          <span className="text-xs text-muted-foreground">Remove permanently</span>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Queue Preview */}
                  {expiringBatches.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Up Next
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {expiringBatches
                          .slice(currentSwipeBatchIndex + 1, currentSwipeBatchIndex + 7)
                          .map((batch, idx) => (
                            <Card
                              key={batch.id}
                              className="p-3 cursor-pointer hover:border-slate-300 transition-colors"
                              onClick={() =>
                                setCurrentSwipeBatchIndex(currentSwipeBatchIndex + idx + 1)
                              }
                            >
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {batch.drug?.brandName || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{batch.batchNumber}</p>
                              <div className="mt-2">
                                {getExpiryStatusBadge(batch.daysUntilExpiry)}
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="p-8 pt-6">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
                    <h3 className="text-lg font-semibold">No Incorrect Pick Alerts</h3>
                    <p className="text-sm text-muted-foreground">All picks are correct</p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-red-500">
                    <CardContent className="flex items-start justify-between p-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="mt-1 h-5 w-5 text-red-500" />
                        <div>
                          <h4 className="font-semibold">Incorrect Pick Detected</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Shelf:{' '}
                            <span className="font-medium">{alert.shelfLocation?.shelfCode}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(alert.createdAt))}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentAlert(alert);
                          setShowAlertModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Review
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Shelf Dialog */}
        <Dialog open={showAddShelfDialog} onOpenChange={setShowAddShelfDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Shelf</DialogTitle>
              <DialogDescription>
                Create a new shelf location with capacity and zone information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelfCode">Shelf Code*</Label>
                  <Input
                    id="shelfCode"
                    placeholder="e.g., A1"
                    value={formData.shelfCode}
                    onChange={(e) => setFormData({ ...formData, shelfCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfName">Shelf Name*</Label>
                  <Input
                    id="shelfName"
                    placeholder="e.g., Main Storage"
                    value={formData.shelfName}
                    onChange={(e) => setFormData({ ...formData, shelfName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={formData.zone}
                  onValueChange={(value) => setFormData({ ...formData, zone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="Controlled">Controlled Substances</SelectItem>
                    <SelectItem value="Hazardous">Hazardous Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.zone === 'Refrigerated' && (
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (e.g., 2-8°C)</Label>
                  <Input
                    id="temperature"
                    placeholder="e.g., 4°C"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) =>
                      setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="columns">Columns</Label>
                  <Input
                    id="columns"
                    type="number"
                    min="1"
                    value={formData.columns}
                    onChange={(e) =>
                      setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddShelfDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateShelf} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Shelf
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Shelf Dialog */}
        <Dialog open={showEditShelfDialog} onOpenChange={setShowEditShelfDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Shelf</DialogTitle>
              <DialogDescription>Update shelf location information and settings</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-shelfCode">Shelf Code*</Label>
                  <Input
                    id="edit-shelfCode"
                    placeholder="e.g., A1"
                    value={formData.shelfCode}
                    onChange={(e) => setFormData({ ...formData, shelfCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-shelfName">Shelf Name*</Label>
                  <Input
                    id="edit-shelfName"
                    placeholder="e.g., Main Storage"
                    value={formData.shelfName}
                    onChange={(e) => setFormData({ ...formData, shelfName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-zone">Zone</Label>
                <Select
                  value={formData.zone}
                  onValueChange={(value) => setFormData({ ...formData, zone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="Controlled">Controlled Substances</SelectItem>
                    <SelectItem value="Hazardous">Hazardous Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.zone === 'Refrigerated' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-temperature">Temperature (e.g., 2-8°C)</Label>
                  <Input
                    id="edit-temperature"
                    placeholder="e.g., 4°C"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rows">Rows</Label>
                  <Input
                    id="edit-rows"
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) =>
                      setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-columns">Columns</Label>
                  <Input
                    id="edit-columns"
                    type="number"
                    min="1"
                    value={formData.columns}
                    onChange={(e) =>
                      setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Total Capacity</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditShelfDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateShelf} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Shelf
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Shelf Details Sheet */}
        <Sheet open={showViewShelfDialog} onOpenChange={setShowViewShelfDialog}>
          <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
            <SheetHeader className="px-6">
              <SheetTitle>Shelf Details</SheetTitle>
              <SheetDescription>
                View and manage inventory layout for this shelf location
              </SheetDescription>
            </SheetHeader>
            {viewingShelf && (
              <div className="space-y-6">
                {/* Header */}
                {/* <div className="px-6">
                <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 rounded-2xl p-6 border border-slate-200/60">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl shadow-2xl shadow-blue-600/40">
                        {viewingShelf.shelfCode}
                      </div>
                      {viewingShelf.status === 'ACTIVE' && (
                        <div className="absolute -top-2 -right-2">
                          <div className="relative">
                            <div className="h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>
                            <div className="absolute inset-0 h-5 w-5 rounded-full bg-emerald-400 animate-ping"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">{viewingShelf.shelfName}</h2>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Grid3x3 className="h-4 w-4" />
                          <span>{viewingShelf.row} × {viewingShelf.column} Configuration</span>
                        </div>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold">{viewingShelf.capacity} Total Slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}

                {/* Shelf Layout */}
                {viewingShelf.row && viewingShelf.column && (
                  <div className="mx-6">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 px-6 py-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Grid3x3 className="h-4 w-4 text-blue-600" />
                          Inventory Layout Matrix
                        </h3>
                      </div>
                      <div className="p-8 space-y-5 bg-gradient-to-br from-white via-slate-50/30 to-indigo-50/20">
                        {/* Rows */}
                        {Array.from({ length: parseInt(viewingShelf.row || '3') }).map(
                          (_, rowIdx) => {
                            return (
                              <div key={rowIdx} className="relative">
                                {/* Row Label - Premium Professional Style */}
                                <div className="absolute -left-20 top-1/2 -translate-y-1/2 h-auto flex items-center">
                                  <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-400 via-indigo-400 to-slate-900 text-white text-[12px] font-bold shadow-xl hover:shadow-2xl transition-all border border-indigo-400/40 uppercase tracking-widest ring-2 ring-white/20 backdrop-blur-sm">
                                    Row {rowIdx + 1}
                                  </div>
                                </div>

                                {/* Shelf Container - Professional warehouse style */}
                                <div className="bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/40 rounded-2xl border-2 border-indigo-300/60 p-5 shadow-xl hover:shadow-2xl transition-all ring-1 ring-white/70 backdrop-blur-sm">
                                  <div className="flex gap-2.5">
                                    {/* Slots */}
                                    {Array.from({
                                      length: parseInt(viewingShelf.column || '5'),
                                    }).map((_, colIdx) => {
                                      const slotNumber =
                                        rowIdx * parseInt(viewingShelf.column || '5') + colIdx + 1;
                                      const batchInSlot = viewingShelf.batches?.find(
                                        (b) => Number(b.slotPosition) === slotNumber
                                      );

                                      // Determine color based on expiry status
                                      const batch = batchInSlot;
                                      const daysUntilExpiry = batch?.daysUntilExpiry ?? 999;
                                      const getSlotColor = () => {
                                        if (!batch)
                                          return {
                                            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
                                            border: 'border-slate-300',
                                            text: 'text-slate-500',
                                            indicator: 'bg-slate-200',
                                            barColor: 'from-slate-400 to-slate-300',
                                          };

                                        if (daysUntilExpiry < 0) {
                                          return {
                                            bg: 'bg-gradient-to-br from-red-50 via-white to-red-50/50',
                                            border: 'border-red-400/60',
                                            text: 'text-red-900',
                                            indicator: 'bg-red-200/70',
                                            barColor: 'from-red-600 to-red-500',
                                          };
                                        } else if (daysUntilExpiry <= 7) {
                                          return {
                                            bg: 'bg-gradient-to-br from-red-50 via-white to-red-50/50',
                                            border: 'border-red-400/60',
                                            text: 'text-red-800',
                                            indicator: 'bg-red-200/70',
                                            barColor: 'from-red-600 to-red-500',
                                          };
                                        } else if (daysUntilExpiry <= 14) {
                                          return {
                                            bg: 'bg-gradient-to-br from-orange-50 via-white to-orange-50/50',
                                            border: 'border-orange-400/60',
                                            text: 'text-orange-900',
                                            indicator: 'bg-orange-200/70',
                                            barColor: 'from-orange-600 to-orange-500',
                                          };
                                        } else if (daysUntilExpiry <= 30) {
                                          return {
                                            bg: 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50',
                                            border: 'border-amber-400/60',
                                            text: 'text-amber-900',
                                            indicator: 'bg-amber-200/70',
                                            barColor: 'from-amber-600 to-amber-500',
                                          };
                                        } else {
                                          return {
                                            bg: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30',
                                            border: 'border-indigo-300/60',
                                            text: 'text-slate-800',
                                            indicator: 'bg-indigo-200/70',
                                            barColor: 'from-indigo-600 to-blue-500',
                                          };
                                        }
                                      };

                                      const slotColor = getSlotColor();

                                      return (
                                        <div key={colIdx} className="flex-1 group/slot h-full">
                                          {/* Slot Card - Professional Design */}
                                          <div
                                            className={cn(
                                              'relative h-32 rounded-xl border-2 flex flex-col cursor-pointer transition-all duration-300',
                                              'shadow-lg hover:shadow-2xl hover:-translate-y-2 overflow-hidden',
                                              'group backdrop-blur-xs',
                                              slotColor.bg,
                                              slotColor.border
                                            )}
                                            onClick={() =>
                                              handleSlotClick(batch, slotNumber, viewingShelf.id)
                                            }
                                          >
                                            {/* Smooth gradient overlay on hover */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 bg-gradient-to-br from-white via-transparent to-transparent transition-opacity duration-300"></div>

                                            {/* Top Status Bar */}
                                            <div
                                              className={cn(
                                                'h-2 bg-gradient-to-r transition-all duration-300',
                                                `${slotColor.barColor}`
                                              )}
                                            ></div>

                                            {batchInSlot ? (
                                              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-2 py-2 gap-1">
                                                {/* Icon Container */}
                                                <div
                                                  className={cn(
                                                    'p-2 rounded-lg mb-0.5',
                                                    slotColor.indicator
                                                  )}
                                                >
                                                  <Pill className={cn('h-4 w-4', slotColor.text)} />
                                                </div>

                                                {/* Brand Name */}
                                                <p
                                                  className={cn(
                                                    'text-[14px] font-bold truncate w-full text-center leading-snug',
                                                    slotColor.text
                                                  )}
                                                >
                                                  {batchInSlot.drug?.brandName || 'Medicine'}
                                                </p>

                                                {/* Quantity and Status */}
                                                <div className="flex flex-col items-center gap-0.5 mt-auto">
                                                  <p
                                                    className={cn(
                                                      'text-[12px] font-semibold opacity-85',
                                                      slotColor.text
                                                    )}
                                                  >
                                                    QTY: {batchInSlot.quantity}
                                                  </p>
                                                  {daysUntilExpiry < 0 && (
                                                    <span
                                                      className={cn(
                                                        'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                                                        slotColor.text,
                                                        slotColor.indicator
                                                      )}
                                                    >
                                                      EXPIRED
                                                    </span>
                                                  )}
                                                  {daysUntilExpiry >= 0 && daysUntilExpiry <= 7 && (
                                                    <span
                                                      className={cn(
                                                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                                                        slotColor.text,
                                                        slotColor.indicator
                                                      )}
                                                    >
                                                      {daysUntilExpiry}d left
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                                                <div
                                                  className={cn(
                                                    'p-2 rounded-lg mb-1',
                                                    slotColor.indicator
                                                  )}
                                                >
                                                  <Box className={cn('h-4 w-4', slotColor.text)} />
                                                </div>
                                                <p
                                                  className={cn(
                                                    'text-[9px] font-bold uppercase tracking-wider text-center',
                                                    slotColor.text
                                                  )}
                                                >
                                                  Empty Slot
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Legend */}
                      <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-xl border-2 border-indigo-200/50 shadow-lg ring-1 ring-white/50">
                        <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 "></div>
                          <span className="text-[14px]">Inventory Status Guide</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-red-50/30 border-2 border-red-300/50 hover:border-red-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-red-600 to-red-500 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">Expired</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-red-50/30 border-2 border-red-300/50 hover:border-red-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-red-600 to-red-500 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">≤7 days</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-orange-50/30 border-2 border-orange-300/50 hover:border-orange-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">≤14 days</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-300/50 hover:border-amber-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">≤30 days</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-300/50 hover:border-indigo-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">
                              &gt;30 days
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-slate-50/30 border-2 border-slate-300/50 hover:border-slate-400/70 hover:shadow-md transition-all">
                            <div className="h-1.5 w-6 rounded-full bg-gradient-to-r from-slate-400 to-slate-300 shadow-sm"></div>
                            <span className="font-bold text-slate-700 text-[14px]">Empty</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mx-6 grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() => {
                      openEditShelf(viewingShelf);
                      setShowViewShelfDialog(false);
                    }}
                  >
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Shelf Configuration
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-14 font-semibold shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-all duration-300"
                    onClick={() => {
                      setShelfToDelete(viewingShelf);
                      setShowDeleteConfirm(true);
                      setShowViewShelfDialog(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete Shelf
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shelf</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Are you sure you want to delete shelf{' '}
                    <span className="font-semibold">&quot;{shelfToDelete?.shelfCode}&quot;</span>?
                  </p>
                  {shelfToDelete && (shelfToDelete.currentStock || 0) > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-800 text-sm font-medium">
                        ⚠️ This shelf contains{' '}
                        <span className="font-bold">{shelfToDelete.currentStock} batch(es)</span>.
                      </p>
                      <p className="text-amber-700 text-xs mt-1">
                        You can either move the batches first, or force delete to remove everything.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {shelfToDelete && (shelfToDelete.currentStock || 0) > 0 ? (
                <AlertDialogAction
                  onClick={() => handleDeleteShelf(true)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Force Delete All
                </AlertDialogAction>
              ) : (
                <AlertDialogAction
                  onClick={() => handleDeleteShelf(false)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert Modal */}
        <AlertDialog open={showAlertModal} onOpenChange={setShowAlertModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Incorrect Pick Alert</AlertDialogTitle>
              <AlertDialogDescription>
                {currentAlert && (
                  <div className="space-y-2 mt-2">
                    <p>Shelf: {currentAlert.shelfLocation?.shelfCode}</p>
                    <p>Time: {formatDate(new Date(currentAlert.createdAt))}</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => currentAlert && handleAcknowledgeAlert(currentAlert.id)}
              >
                Acknowledge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Batch Details Dialog */}
        <Dialog open={showBatchDetailsDialog} onOpenChange={setShowBatchDetailsDialog}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
                Medicine & Batch Details
              </DialogTitle>
              <DialogDescription>
                Comprehensive information about this inventory item
              </DialogDescription>
            </DialogHeader>
            {selectedBatch &&
              (() => {
                const batchDaysUntilExpiry = selectedBatch.daysUntilExpiry ?? 999;
                return (
                  <div className="space-y-5 pt-2">
                    {/* Medicine Header Card */}
                    <Card
                      className={cn(
                        'border-2 shadow-sm',
                        batchDaysUntilExpiry < 0
                          ? 'border-red-500 bg-red-50'
                          : batchDaysUntilExpiry <= 7
                            ? 'border-red-400 bg-red-50'
                            : batchDaysUntilExpiry <= 14
                              ? 'border-orange-400 bg-orange-50'
                              : batchDaysUntilExpiry <= 30
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-emerald-400 bg-emerald-50'
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900">
                                {selectedBatch.drug?.brandName}
                              </h3>
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                              {selectedBatch.drug?.genericName}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="outline" className="font-mono text-xs">
                                Batch: {selectedBatch.batchNumber}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Slot #{selectedBatch.slotPosition}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            {getExpiryStatusBadge(selectedBatch.daysUntilExpiry)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expiry Information Card */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Expiry Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Expiry Date
                            </Label>
                            <p className="font-semibold text-base">
                              {formatDate(new Date(selectedBatch.expiryDate))}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Days Remaining
                            </Label>
                            <p
                              className={cn(
                                'font-bold text-xl',
                                batchDaysUntilExpiry < 0
                                  ? 'text-red-600'
                                  : batchDaysUntilExpiry <= 7
                                    ? 'text-red-600'
                                    : batchDaysUntilExpiry <= 14
                                      ? 'text-orange-600'
                                      : batchDaysUntilExpiry <= 30
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                              )}
                            >
                              {batchDaysUntilExpiry < 0
                                ? `Expired ${Math.abs(batchDaysUntilExpiry)}d ago`
                                : `${batchDaysUntilExpiry} days`}
                            </p>
                          </div>
                        </div>

                        {/* Status Alert Box */}
                        <div
                          className={cn(
                            'p-4 rounded-lg border-l-4',
                            batchDaysUntilExpiry < 0
                              ? 'bg-red-50 border-red-600'
                              : batchDaysUntilExpiry <= 7
                                ? 'bg-red-50 border-red-500'
                                : batchDaysUntilExpiry <= 14
                                  ? 'bg-orange-50 border-orange-500'
                                  : batchDaysUntilExpiry <= 30
                                    ? 'bg-amber-50 border-amber-500'
                                    : 'bg-emerald-50 border-emerald-500'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className={cn(
                                'h-5 w-5 mt-0.5 flex-shrink-0',
                                batchDaysUntilExpiry < 0
                                  ? 'text-red-600'
                                  : batchDaysUntilExpiry <= 7
                                    ? 'text-red-600'
                                    : batchDaysUntilExpiry <= 14
                                      ? 'text-orange-600'
                                      : batchDaysUntilExpiry <= 30
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                              )}
                            />
                            <div className="space-y-1">
                              <p
                                className={cn(
                                  'text-sm font-bold',
                                  batchDaysUntilExpiry < 0
                                    ? 'text-red-900'
                                    : batchDaysUntilExpiry <= 7
                                      ? 'text-red-900'
                                      : batchDaysUntilExpiry <= 14
                                        ? 'text-orange-900'
                                        : batchDaysUntilExpiry <= 30
                                          ? 'text-amber-900'
                                          : 'text-emerald-900'
                                )}
                              >
                                {batchDaysUntilExpiry < 0
                                  ? 'EXPIRED - IMMEDIATE ACTION REQUIRED'
                                  : batchDaysUntilExpiry <= 7
                                    ? 'URGENT - EXPIRES WITHIN 7 DAYS'
                                    : batchDaysUntilExpiry <= 14
                                      ? 'CRITICAL - EXPIRES WITHIN 14 DAYS'
                                      : batchDaysUntilExpiry <= 30
                                        ? 'WARNING - EXPIRES WITHIN 30 DAYS'
                                        : 'NORMAL - SUFFICIENT TIME BEFORE EXPIRY'}
                              </p>
                              <p
                                className={cn(
                                  'text-xs leading-relaxed',
                                  batchDaysUntilExpiry < 0
                                    ? 'text-red-700'
                                    : batchDaysUntilExpiry <= 7
                                      ? 'text-red-700'
                                      : batchDaysUntilExpiry <= 14
                                        ? 'text-orange-700'
                                        : batchDaysUntilExpiry <= 30
                                          ? 'text-amber-700'
                                          : 'text-emerald-700'
                                )}
                              >
                                {batchDaysUntilExpiry < 0
                                  ? 'This medicine has expired and must be removed from inventory immediately. Do not dispense to patients.'
                                  : batchDaysUntilExpiry <= 7
                                    ? 'High priority: Consider returning to vendor or immediate sale with discount. Monitor daily.'
                                    : batchDaysUntilExpiry <= 14
                                      ? 'Priority sale recommended. Contact vendor for return options or implement promotional pricing.'
                                      : batchDaysUntilExpiry <= 30
                                        ? 'Monitor closely and consider promotional pricing to move stock before expiry.'
                                        : 'Continue normal operations. Stock is within safe expiry range.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inventory Details Card */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          Inventory Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Quantity
                            </Label>
                            <p className="font-semibold text-base">
                              {selectedBatch.quantity} units
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Location
                            </Label>
                            <p className="font-semibold text-base">{selectedBatch.location}</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Date Added
                            </Label>
                            <p className="font-semibold text-base">
                              {formatDate(new Date(selectedBatch.dateAdded))}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Supplier ID
                            </Label>
                            <p className="font-semibold font-mono text-sm">
                              {selectedBatch.supplierId}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Details Card */}
                    <Card className="border shadow-sm bg-gradient-to-br from-slate-50 to-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Financial Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Purchase Price
                            </Label>
                            <p className="font-semibold text-base">
                              {formatCurrency(selectedBatch.purchasePrice)}
                              <span className="text-xs text-muted-foreground ml-1">/ unit</span>
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Sell Price
                            </Label>
                            <p className="font-semibold text-base">
                              {formatCurrency(selectedBatch.sellPrice)}
                              <span className="text-xs text-muted-foreground ml-1">/ unit</span>
                            </p>
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Total Inventory Value
                            </Label>
                            <p className="font-bold text-2xl text-primary">
                              {formatCurrency(selectedBatch.sellPrice * selectedBatch.quantity)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Potential profit:{' '}
                              {formatCurrency(
                                (selectedBatch.sellPrice - selectedBatch.purchasePrice) *
                                  selectedBatch.quantity
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            <DialogFooter className="border-t pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchDetailsDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => selectedBatch && openEditBatch(selectedBatch)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Batch
              </Button>
              {selectedBatch && (selectedBatch.daysUntilExpiry ?? 999) <= 30 && (
                <Button
                  className={cn(
                    'flex-1',
                    (selectedBatch.daysUntilExpiry ?? 999) < 0
                      ? 'bg-red-600 hover:bg-red-700'
                      : (selectedBatch.daysUntilExpiry ?? 999) <= 7
                        ? 'bg-red-600 hover:bg-red-700'
                        : (selectedBatch.daysUntilExpiry ?? 999) <= 14
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-amber-600 hover:bg-amber-700'
                  )}
                  onClick={() => {
                    // This would trigger the expiry action flow
                    setShowBatchDetailsDialog(false);
                    showNotification('Expiry management action triggered');
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Take Action
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Configure Batch Dialog - Add/Edit Batch Data */}
        <Dialog open={showConfigureBatchDialog} onOpenChange={setShowConfigureBatchDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {configuringSlot?.existingBatch
                  ? 'Edit Batch Data'
                  : `Add Batch to Slot ${configuringSlot?.slotNumber}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Drug Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Medicine *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.drugId}
                  onChange={(e) => setBatchFormData({ ...batchFormData, drugId: e.target.value })}
                  required
                >
                  <option value="">Select a medicine...</option>
                  {drugs.map((drug) => (
                    <option key={drug.id} value={drug.id}>
                      {drug.brand_name} ({drug.generic_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label className="text-sm font-medium mb-2 block">Batch Number *</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.batchNumber}
                  onChange={(e) =>
                    setBatchFormData({ ...batchFormData, batchNumber: e.target.value })
                  }
                  placeholder="e.g., B1234"
                  required
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity *</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.quantity}
                  onChange={(e) =>
                    setBatchFormData({ ...batchFormData, quantity: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  required
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="text-sm font-medium mb-2 block">Purchase Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.purchasePrice}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      purchasePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  required
                />
              </div>

              {/* Sell Price */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sell Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.sellPrice}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      sellPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-sm font-medium mb-2 block">Expiry Date *</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.expiryDate}
                  onChange={(e) =>
                    setBatchFormData({ ...batchFormData, expiryDate: e.target.value })
                  }
                  required
                />
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Supplier</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.supplierId}
                  onChange={(e) =>
                    setBatchFormData({ ...batchFormData, supplierId: e.target.value })
                  }
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-2 block">Warehouse Location</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={batchFormData.location}
                  onChange={(e) => setBatchFormData({ ...batchFormData, location: e.target.value })}
                  placeholder="e.g., Warehouse A"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfigureBatchDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBatch}
                disabled={isSaving || !batchFormData.drugId || !batchFormData.batchNumber}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : configuringSlot?.existingBatch ? (
                  'Update Batch'
                ) : (
                  'Add to Slot'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discount Dialog */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Apply Discount</DialogTitle>
              <DialogDescription>
                Reduce the price to accelerate sales before expiry
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Current Batch Info */}
              {currentBatch && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Product</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {currentBatch.drug?.brandName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(currentBatch.sellPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {currentBatch.quantity} units
                    </span>
                  </div>
                </div>
              )}

              {/* Discount Input */}
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-medium">
                  Discount Percentage
                </Label>
                <div className="relative">
                  <Input
                    id="discount"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Enter discount"
                    value={discountPercentage || ''}
                    onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* New Price Preview */}
              {currentBatch && discountPercentage > 0 && discountPercentage <= 100 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        New Price
                      </p>
                      <p className="text-xl font-bold text-emerald-700 mt-1">
                        {formatCurrency(currentBatch.sellPrice * (1 - discountPercentage / 100))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Savings</p>
                      <p className="text-base font-semibold text-amber-600">
                        {formatCurrency(currentBatch.sellPrice * (discountPercentage / 100))} per
                        unit
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDiscountDialog(false);
                  setDiscountPercentage(0);
                }}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyDiscount}
                disabled={isProcessingAction || discountPercentage <= 0 || discountPercentage > 100}
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Discount'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dispose Confirmation Dialog */}
        <AlertDialog open={showDisposeDialog} onOpenChange={setShowDisposeDialog}>
          <AlertDialogContent className="sm:max-w-[480px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Disposal</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 pt-2">
                  <p>
                    This will permanently remove the batch from your inventory. This action cannot
                    be undone.
                  </p>
                  {currentBatch && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Product</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {currentBatch.drug?.brandName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Batch</span>
                        <span className="text-sm font-mono text-slate-900">
                          {currentBatch.batchNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {currentBatch.quantity} units
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-sm text-muted-foreground">Value to Write-off</span>
                        <span className="text-base font-bold text-red-600">
                          {formatCurrency(currentBatch.sellPrice * currentBatch.quantity)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isProcessingAction}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisposeBatch}
                disabled={isProcessingAction}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Dispose Batch'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toast Notification */}
        {toast.visible && (
          <div
            className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white transition-all duration-300 flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
