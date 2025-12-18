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
} from '@/lib/types';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Eye,
  Zap,
  Edit,
  Thermometer,
  Box,
  Loader2,
  Pill,
} from 'lucide-react';

// Mock batch data with different expiry states
const generateMockBatches = (shelfId: string, startSlot: number, count: number) => {
  const medicines = [
    { brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', qty: 100 },
    { brand: 'Lisinopril 10mg', generic: 'Lisinopril', qty: 75 },
    { brand: 'Atorvastatin 20mg', generic: 'Atorvastatin', qty: 120 },
    { brand: 'Metformin 850mg', generic: 'Metformin', qty: 90 },
    { brand: 'Omeprazole 40mg', generic: 'Omeprazole', qty: 60 },
    { brand: 'Levothyroxine 50mcg', generic: 'Levothyroxine', qty: 85 },
    { brand: 'Amlodipine 5mg', generic: 'Amlodipine', qty: 95 },
    { brand: 'Metoprolol 100mg', generic: 'Metoprolol', qty: 70 },
    { brand: 'Simvastatin 40mg', generic: 'Simvastatin', qty: 110 },
    { brand: 'Losartan 50mg', generic: 'Losartan', qty: 80 },
    { brand: 'Gabapentin 300mg', generic: 'Gabapentin', qty: 65 },
    { brand: 'Sertraline 50mg', generic: 'Sertraline', qty: 55 },
    { brand: 'Montelukast 10mg', generic: 'Montelukast', qty: 45 },
    { brand: 'Escitalopram 10mg', generic: 'Escitalopram', qty: 50 },
    { brand: 'Rosuvastatin 10mg', generic: 'Rosuvastatin', qty: 85 },
  ];

  const today = new Date();
  const batches = [];

  // Create batches with different expiry statuses
  const expiryScenarios = [
    { days: -5, status: 'expired' },      // Already expired
    { days: -2, status: 'expired' },      // Recently expired
    { days: 3, status: 'urgent' },        // Expires in 3 days (urgent)
    { days: 5, status: 'urgent' },        // Expires in 5 days (urgent)
    { days: 10, status: 'critical' },     // Expires in 10 days (critical)
    { days: 12, status: 'critical' },     // Expires in 12 days (critical)
    { days: 20, status: 'warning' },      // Expires in 20 days (warning)
    { days: 25, status: 'warning' },      // Expires in 25 days (warning)
    { days: 45, status: 'normal' },       // Expires in 45 days (normal)
    { days: 60, status: 'normal' },       // Expires in 60 days (normal)
    { days: 90, status: 'normal' },       // Expires in 90 days (normal)
    { days: 120, status: 'normal' },      // Expires in 120 days (normal)
    { days: 150, status: 'normal' },      // Expires in 150 days (normal)
    { days: 180, status: 'normal' },      // Expires in 180 days (normal)
    { days: 200, status: 'normal' },      // Expires in 200 days (normal)
  ];

  for (let i = 0; i < count && i < medicines.length; i++) {
    const medicine = medicines[i];
    const scenario = expiryScenarios[i % expiryScenarios.length];
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + scenario.days);

    batches.push({
      id: `batch-${shelfId}-${i + 1}`,
      drugId: `drug-${i + 1}`,
      batchNumber: `B${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      quantity: medicine.qty,
      expiryDate: expiryDate.toISOString(),
      purchasePrice: 3 + Math.random() * 15,
      sellPrice: 5 + Math.random() * 20,
      supplierId: `supplier-${Math.floor(Math.random() * 5) + 1}`,
      location: `Shelf ${shelfId}`,
      dateAdded: new Date(today.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      slotPosition: startSlot + i,
      daysUntilExpiry: scenario.days,
      expiryStatus: scenario.status,
      drug: {
        brandName: medicine.brand,
        genericName: medicine.generic,
        id: `drug-${i + 1}`,
      },
    } as any);
  }

  return batches;
};

// Mock shelf data
const mockShelves: ShelfLocation[] = [
  {
    id: 'shelf-1',
    shelfCode: 'A1',
    shelfName: 'General Medicine Shelf',
    zone: 'General',
    capacity: 15,
    row: '3',
    column: '5',
    status: 'ACTIVE',
    currentStock: 12,
    utilizationPercentage: 80,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    batches: generateMockBatches('A1', 1, 12),
  },
  {
    id: 'shelf-2',
    shelfCode: 'B2',
    shelfName: 'Antibiotics Shelf',
    zone: 'General',
    capacity: 12,
    row: '3',
    column: '4',
    status: 'ACTIVE',
    currentStock: 9,
    utilizationPercentage: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    batches: generateMockBatches('B2', 1, 9),
  },
  {
    id: 'shelf-3',
    shelfCode: 'C3',
    shelfName: 'Cardiovascular Shelf',
    zone: 'General',
    capacity: 15,
    row: '3',
    column: '5',
    status: 'ACTIVE',
    currentStock: 14,
    utilizationPercentage: 93,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    batches: generateMockBatches('C3', 1, 14),
  },
];

export default function SmartShelfPage() {
  // State
  const [shelves, setShelves] = useState<ShelfLocation[]>(mockShelves);
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
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [showBatchDetailsDialog, setShowBatchDetailsDialog] = useState(false);

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

  // Calculate analytics from mock data
  useEffect(() => {
    const allBatches = shelves.flatMap((s) => s.batches || []);
    const expiringBatches = allBatches.filter((b: any) => b.daysUntilExpiry <= 30);

    setAnalytics({
      totalShelves: shelves.length,
      activeShelves: shelves.filter((s) => s.status === 'ACTIVE').length,
      totalBatchesOnShelf: allBatches.length,
      expiringCount: expiringBatches.length,
      incorrectPickCount: 0,
      topUtilizedShelves: shelves
        .sort((a, b) => (b.utilizationPercentage || 0) - (a.utilizationPercentage || 0))
        .slice(0, 3)
        .map((s) => ({
          shelfCode: s.shelfCode,
          shelfName: s.shelfName,
          currentStock: s.currentStock || 0,
          capacity: s.capacity || 0,
          utilizationPercentage: s.utilizationPercentage || 0,
        })),
    });

    setExpiringBatches(expiringBatches as any);
  }, [shelves]);

  // Create shelf
  const handleCreateShelf = async () => {
    setIsSaving(true);
    try {
      // For mock mode, just add to local state
      const newShelf: ShelfLocation = {
        id: `shelf-${Date.now()}`,
        shelfCode: formData.shelfCode,
        shelfName: formData.shelfName,
        zone: formData.zone,
        capacity: formData.capacity,
        row: String(formData.rows),
        column: String(formData.columns),
        status: 'ACTIVE',
        currentStock: 0,
        utilizationPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        batches: [],
        notes: formData.zone === 'Refrigerated' ? formData.notes : undefined,
      };

      setShelves([...shelves, newShelf]);
      setShowAddShelfDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error creating shelf:', err);
      alert('Failed to create shelf');
    } finally {
      setIsSaving(false);
    }
  };

  // Update shelf
  const handleUpdateShelf = async () => {
    if (!editingShelf) return;
    setIsSaving(true);
    try {
      // For mock mode, update local state
      setShelves(
        shelves.map((s) =>
          s.id === editingShelf.id
            ? {
                ...s,
                shelfCode: formData.shelfCode,
                shelfName: formData.shelfName,
                zone: formData.zone,
                capacity: formData.capacity,
                row: String(formData.rows),
                column: String(formData.columns),
                notes: formData.zone === 'Refrigerated' ? formData.notes : undefined,
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
      setShowEditShelfDialog(false);
      setEditingShelf(null);
      resetForm();
    } catch (err) {
      console.error('Error updating shelf:', err);
      alert('Failed to update shelf');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete shelf
  const handleDeleteShelf = async () => {
    if (!shelfToDelete) return;
    try {
      // For mock mode, remove from local state
      setShelves(shelves.filter((s) => s.id !== shelfToDelete.id));
      setShowDeleteConfirm(false);
      setShelfToDelete(null);
    } catch (err) {
      console.error('Error deleting shelf:', err);
      alert('Failed to delete shelf');
    }
  };

  const openShelfDetails = async (shelf: ShelfLocation) => {
    // For mock mode, use local data
    setViewingShelf(shelf);
    setShowViewShelfDialog(true);
  };

  const handleSlotClick = (batch: any) => {
    setSelectedBatch(batch);
    setShowBatchDetailsDialog(true);
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

    try {
      await apiClient.smartShelf.recordExpiryAction({
        batchId: currentBatch.id,
        action,
        quantity: currentBatch.quantity,
        vendorReturn: action === 'RETURN_TO_VENDOR',
        reason: `${action} via Smart Shelf`,
      });

      if (currentSwipeBatchIndex < expiringBatches.length - 1) {
        setCurrentSwipeBatchIndex(currentSwipeBatchIndex + 1);
      } else {
        const res = await apiClient.smartShelf.getExpiringBatches({ days: 30, limit: 50 });
        setExpiringBatches((res.data as InventoryBatch[]) || []);
        setCurrentSwipeBatchIndex(0);
      }
    } catch (err) {
      console.error('Error recording expiry action:', err);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shelf Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual shelf organization with FEFO enforcement & intelligent inventory tracking
          </p>
        </div>
        <Button onClick={() => setShowAddShelfDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Shelf
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shelves</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalShelves}</div>
              <p className="text-xs text-muted-foreground">{analytics.activeShelves} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBatchesOnShelf}</div>
              <p className="text-xs text-muted-foreground">Across all shelves</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{analytics.expiringCount}</div>
              <p className="text-xs text-muted-foreground">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FEFO Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.incorrectPickCount}</div>
              <p className="text-xs text-muted-foreground">Unacknowledged alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {analytics.topUtilizedShelves?.[0]?.utilizationPercentage?.toFixed(0) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.topUtilizedShelves?.[0]?.shelfCode || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="shelves" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="shelves" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            Shelves
          </TabsTrigger>
          <TabsTrigger value="swipe" className="gap-2">
            <Zap className="h-4 w-4" />
            Expiring
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
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

        {/* Shelves Tab */}
        <TabsContent value="shelves" className="space-y-4 mt-6">
          {shelves.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Grid3x3 className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Shelves Created</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first shelf location to get started
                </p>
                <Button onClick={() => setShowAddShelfDialog(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Shelf
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shelves.map((shelf) => {
                const util = Math.round(shelf.utilizationPercentage || 0);

                // Determine shelf card styling based on utilization
                const shelfBorderColor =
                  util > 90
                    ? 'border-red-200 hover:border-red-300'
                    : util > 70
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-slate-200 hover:border-emerald-300';

                const shelfBgGradient =
                  util > 90
                    ? 'bg-gradient-to-br from-red-50/50 to-red-100/30'
                    : util > 70
                      ? 'bg-gradient-to-br from-amber-50/50 to-amber-100/30'
                      : 'bg-gradient-to-br from-slate-50 to-white';

                return (
                  <Card
                    key={shelf.id}
                    className={cn(
                      'group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-xl',
                      shelfBorderColor,
                      shelfBgGradient
                    )}
                    onClick={() => openShelfDetails(shelf)}
                  >
                    <CardContent className="p-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-lg shadow-lg border-2 border-slate-600 group-hover:scale-110 transition-transform">
                              {shelf.shelfCode}
                            </div>
                            {shelf.status === 'ACTIVE' && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{shelf.shelfName}</h4>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {shelf.zone && shelf.zone !== 'General' && (
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {shelf.zone}
                                </Badge>
                              )}
                              {shelf.zone === 'Refrigerated' && shelf.notes && (
                                <Badge className="text-xs gap-1 bg-blue-500">
                                  <Thermometer className="h-3 w-3" />
                                  {shelf.notes}
                                </Badge>
                              )}
                              {shelf.row && shelf.column && (
                                <Badge variant="secondary" className="text-xs">
                                  {shelf.row}×{shelf.column}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-8 w-8 p-0 hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShelfDetails(shelf);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Capacity Section */}
                      <div className="space-y-3 bg-white/60 rounded-lg p-4 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Capacity Utilization
                          </span>
                          <span
                            className={cn(
                              'text-sm font-bold px-2.5 py-1 rounded-md',
                              util > 90
                                ? 'text-red-700 bg-red-100 border border-red-200'
                                : util > 70
                                  ? 'text-amber-700 bg-amber-100 border border-amber-200'
                                  : 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                            )}
                          >
                            {util}%
                          </span>
                        </div>

                        <div className="relative h-3 w-full rounded-full bg-slate-200 border border-slate-300 overflow-hidden shadow-inner">
                          <div
                            className={cn(
                              'h-full transition-all duration-500 rounded-full',
                              util > 90
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : util > 70
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            )}
                            style={{ width: `${util}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            <span>{shelf.currentStock || 0} items</span>
                          </div>
                          <span className="text-slate-500">of {shelf.capacity || 0}</span>
                        </div>
                      </div>

                      {/* Status Footer */}
                      <div className="mt-4 flex items-center justify-between">
                        <Badge
                          variant={shelf.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="text-xs font-semibold"
                        >
                          {shelf.status}
                        </Badge>
                        {util > 90 && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Critical
                          </Badge>
                        )}
                        {util > 70 && util <= 90 && (
                          <Badge className="text-xs bg-amber-600">High Usage</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Expiring Items Tab */}
        <TabsContent value="swipe" className="mt-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    Expiring Items - Quick Action
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Review and take action on expiring inventory batches
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {expiringBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No Expiring Items</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    All batches are within safe expiry range. Check back later or adjust the expiry threshold.
                  </p>
                </div>
              ) : currentBatch ? (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">
                        Item {currentSwipeBatchIndex + 1} of {expiringBatches.length}
                      </p>
                      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                          style={{ width: `${((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {Math.round(((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100)}% Complete
                    </Badge>
                  </div>

                  {/* Medicine Card */}
                  <Card className={cn(
                    "relative border-2 shadow-lg overflow-hidden",
                    (currentBatch as any).daysUntilExpiry < 0 ? "border-red-500 bg-red-50" :
                    (currentBatch as any).daysUntilExpiry <= 7 ? "border-red-400 bg-red-50" :
                    (currentBatch as any).daysUntilExpiry <= 14 ? "border-orange-400 bg-orange-50" :
                    (currentBatch as any).daysUntilExpiry <= 30 ? "border-amber-400 bg-amber-50" :
                    "border-slate-300 bg-white"
                  )}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="mb-6 flex items-start justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900">
                              {currentBatch.drug?.brandName || 'Unknown Drug'}
                            </h3>
                            <p className="text-base text-slate-600 font-medium mt-1">
                              {currentBatch.drug?.genericName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              Batch: {currentBatch.batchNumber}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {getExpiryStatusBadge((currentBatch as any).daysUntilExpiry)}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 p-5 rounded-lg bg-white/80 border border-slate-200 shadow-sm">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Quantity
                          </Label>
                          <p className="text-xl font-bold text-slate-900">{currentBatch.quantity} units</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Expiry Date
                          </Label>
                          <p className="text-xl font-bold text-slate-900">
                            {formatDate(new Date(currentBatch.expiryDate))}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Location
                          </Label>
                          <p className="text-lg font-semibold text-slate-700">{currentBatch.location || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Value
                          </Label>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(currentBatch.sellPrice * currentBatch.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-slate-50"
                          onClick={() =>
                            setCurrentSwipeBatchIndex(Math.max(0, currentSwipeBatchIndex - 1))
                          }
                          disabled={currentSwipeBatchIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-slate-50"
                          onClick={() =>
                            setCurrentSwipeBatchIndex(
                              Math.min(expiringBatches.length - 1, currentSwipeBatchIndex + 1)
                            )
                          }
                          disabled={currentSwipeBatchIndex === expiringBatches.length - 1}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleSwipe('RETURN_TO_VENDOR')}
                      className="h-24 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <ArrowRight className="h-7 w-7" />
                      <span className="text-sm font-semibold">Return to Vendor</span>
                    </Button>

                    <Button
                      onClick={() => handleSwipe('DISCOUNT')}
                      className="h-24 flex-col gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Percent className="h-7 w-7" />
                      <span className="text-sm font-semibold">Discount & Push</span>
                    </Button>

                    <Button
                      onClick={() => handleSwipe('DISPOSE')}
                      className="h-24 flex-col gap-2 bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Trash2 className="h-7 w-7" />
                      <span className="text-sm font-semibold">Dispose</span>
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4 mt-6">
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
                        Shelf: <span className="font-medium">{alert.shelfLocation?.shelfCode}</span>
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
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          

          {viewingShelf && (
            <div >
              {/* Shelf Info Card - Matching Reference */}
              <Card className=" border-slate-300 shadow-lg">
                <CardContent >
                  

                  {/* Capacity Section */}
                  
                </CardContent>
              </Card>

              {/* 3D Shelf Layout - Matching Reference Exactly */}
              {viewingShelf.row && viewingShelf.column && (
                <Card className="border-2 border-slate-300 shadow-lg">
                  <CardContent className="p-6 bg-gradient-to-b from-slate-50 to-slate-100">
                    <div className="space-y-6 relative pl-14" style={{ perspective: '1000px' }}>
                      {/* Rows - representing physical shelves with depth */}
                      {Array.from({ length: parseInt(viewingShelf.row || '3') }).map(
                        (_, rowIdx) => {
                          const totalRows = parseInt(viewingShelf.row || '3');
                          const reverseIdx = totalRows - 1 - rowIdx;

                          return (
                            <div key={rowIdx} className="relative">
                              {/* Level Label */}
                              <div className="absolute -left-14 top-1/2 -translate-y-1/2 z-20">
                                <div className="px-2.5 py-1 rounded bg-slate-700 text-white text-[11px] font-bold shadow-md whitespace-nowrap">
                                  ROW {rowIdx + 1}
                                </div>
                              </div>

                              {/* Shelf with 3D perspective */}
                              <div
                                className="relative transition-all duration-300"
                                style={{
                                  transformStyle: 'preserve-3d',
                                  transform: `rotateX(${reverseIdx * 2}deg) translateZ(${reverseIdx * 10}px)`,
                                }}
                              >
                                {/* Main shelf board */}
                                <div className="relative bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg border-2 border-slate-400 shadow-lg">
                                  {/* Slot count indicator */}
                                  <div className="absolute -top-6 right-2 text-[10px] font-semibold text-slate-600">
                                    0 / {parseInt(viewingShelf.column || '5')} slots
                                  </div>

                                  <div className="flex gap-2.5 p-4">
                                    {/* Columns - individual slots with curved bottom */}
                                    {Array.from({
                                      length: parseInt(viewingShelf.column || '5'),
                                    }).map((_, colIdx) => {
                                      const slotNumber =
                                        rowIdx * parseInt(viewingShelf.column || '5') + colIdx + 1;
                                      const batchInSlot = viewingShelf.batches?.find(
                                        (b) =>
                                          (b as unknown as Record<string, unknown>).slotPosition ===
                                          slotNumber
                                      );

                                      // Determine colors based on expiry status
                                      const batch = batchInSlot as any;
                                      const getSlotColor = () => {
                                        if (!batch) return {
                                          gradient: 'bg-gradient-to-b from-white via-slate-50 to-slate-100',
                                          border: '#cbd5e1',
                                          fill: '#94a3b8',
                                          stroke: '#64748b',
                                        };

                                        if (batch.daysUntilExpiry < 0) {
                                          // Expired - dark red
                                          return {
                                            gradient: 'bg-gradient-to-b from-red-800 via-red-900 to-red-950',
                                            border: '#7f1d1d',
                                            fill: '#7f1d1d',
                                            stroke: '#450a0a',
                                          };
                                        } else if (batch.daysUntilExpiry <= 7) {
                                          // Urgent - red
                                          return {
                                            gradient: 'bg-gradient-to-b from-red-400 via-red-500 to-red-600',
                                            border: '#dc2626',
                                            fill: '#dc2626',
                                            stroke: '#991b1b',
                                          };
                                        } else if (batch.daysUntilExpiry <= 14) {
                                          // Critical - orange
                                          return {
                                            gradient: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600',
                                            border: '#ea580c',
                                            fill: '#ea580c',
                                            stroke: '#c2410c',
                                          };
                                        } else if (batch.daysUntilExpiry <= 30) {
                                          // Warning - amber
                                          return {
                                            gradient: 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500',
                                            border: '#f59e0b',
                                            fill: '#f59e0b',
                                            stroke: '#d97706',
                                          };
                                        } else {
                                          // Normal - green
                                          return {
                                            gradient: 'bg-gradient-to-b from-emerald-200 via-emerald-300 to-emerald-400',
                                            border: '#10b981',
                                            fill: '#10b981',
                                            stroke: '#059669',
                                          };
                                        }
                                      };

                                      const slotColor = getSlotColor();

                                      return (
                                        <div key={colIdx} className="flex-1 relative group">
                                          {/* Slot with curved bottom (like your reference) */}
                                          <div
                                            className="relative cursor-pointer"
                                            onClick={() => batch && handleSlotClick(batch)}
                                          >
                                            <div
                                              className={cn(
                                                'relative h-24 transition-all duration-200',
                                                'transform hover:scale-105 hover:shadow-xl',
                                                slotColor.gradient
                                              )}
                                              style={{
                                                borderRadius: '8px 8px 0 0',
                                                borderLeft: `2px solid ${slotColor.border}`,
                                                borderRight: `2px solid ${slotColor.border}`,
                                                borderTop: `2px solid ${slotColor.border}`,
                                              }}
                                            >
                                              {/* Content */}
                                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2">
                                                {batchInSlot ? (
                                                  <>
                                                    {/* Medicine icon */}
                                                    <div className="bg-white rounded-full p-2 shadow-md">
                                                      <Pill className={cn(
                                                        "h-5 w-5",
                                                        batch.daysUntilExpiry < 0 ? "text-red-950" :
                                                        batch.daysUntilExpiry <= 7 ? "text-red-700" :
                                                        batch.daysUntilExpiry <= 14 ? "text-orange-700" :
                                                        batch.daysUntilExpiry <= 30 ? "text-amber-700" :
                                                        "text-emerald-700"
                                                      )} />
                                                    </div>
                                                    <div className="text-center w-full px-1">
                                                      <p className={cn(
                                                        "text-[9px] font-bold truncate leading-tight",
                                                        batch.daysUntilExpiry < 0 ? "text-white" :
                                                        batch.daysUntilExpiry <= 7 ? "text-red-50" :
                                                        batch.daysUntilExpiry <= 14 ? "text-orange-50" :
                                                        batch.daysUntilExpiry <= 30 ? "text-amber-900" :
                                                        "text-emerald-900"
                                                      )}>
                                                        {batchInSlot.drug?.brandName || 'Medicine'}
                                                      </p>
                                                      <p className={cn(
                                                        "text-[8px] font-semibold mt-0.5",
                                                        batch.daysUntilExpiry < 0 ? "text-red-200" :
                                                        batch.daysUntilExpiry <= 7 ? "text-red-100" :
                                                        batch.daysUntilExpiry <= 14 ? "text-orange-100" :
                                                        batch.daysUntilExpiry <= 30 ? "text-amber-800" :
                                                        "text-emerald-700"
                                                      )}>
                                                        Qty: {batchInSlot.quantity}
                                                      </p>
                                                    </div>
                                                  </>
                                                ) : (
                                                  <>
                                                    {/* Empty slot */}
                                                    <div className="text-center flex-1 flex flex-col items-center justify-center">
                                                      <div className="w-full border-b-2 border-dashed border-slate-300 mb-2"></div>
                                                      <Box className="h-6 w-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                                      <div className="w-full border-b-2 border-dashed border-slate-300 mt-2"></div>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            </div>

                                            {/* Curved bottom base (like your reference image) */}
                                            <div className="relative h-4">
                                              <svg
                                                className="absolute inset-0 w-full h-full"
                                                viewBox="0 0 100 20"
                                                preserveAspectRatio="none"
                                              >
                                                <path
                                                  d="M 0,0 L 0,10 Q 50,20 100,10 L 100,0 Z"
                                                  fill={slotColor.fill}
                                                  stroke={slotColor.stroke}
                                                  strokeWidth="1"
                                                />
                                              </svg>
                                            </div>

                                            {/* Hover tooltip */}
                                            {batchInSlot && (
                                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap min-w-max">
                                                  <p className="font-bold text-emerald-400">
                                                    {batchInSlot.drug?.brandName}
                                                  </p>
                                                  <p className="text-slate-300">
                                                    Batch: {batchInSlot.batchNumber}
                                                  </p>
                                                  <p className="text-slate-300">
                                                    Qty: {batchInSlot.quantity} units
                                                  </p>
                                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Shelf bottom shadow */}
                                  <div className="absolute -bottom-2 left-2 right-2 h-2 bg-gradient-to-b from-slate-600/50 to-transparent rounded-full blur-md"></div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Legend */}
                    <div className="space-y-3 mt-6 bg-white p-4 rounded-lg border-2 border-slate-200">
                      <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wide">
                        Expiry Status Legend
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-red-900 bg-gradient-to-b from-red-800 to-red-950 shadow-sm"></div>
                          <span className="font-medium">Expired</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-red-600 bg-gradient-to-b from-red-400 to-red-600 shadow-sm"></div>
                          <span className="font-medium">≤7 days (Urgent)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-orange-600 bg-gradient-to-b from-orange-400 to-orange-600 shadow-sm"></div>
                          <span className="font-medium">≤14 days (Critical)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-amber-500 bg-gradient-to-b from-amber-300 to-amber-500 shadow-sm"></div>
                          <span className="font-medium">≤30 days (Warning)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-emerald-500 bg-gradient-to-b from-emerald-200 to-emerald-400 shadow-sm"></div>
                          <span className="font-medium">&gt;30 days (Normal)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-slate-300 bg-gradient-to-b from-white to-slate-100 shadow-sm"></div>
                          <span className="font-medium">Empty Slot</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Total Batches:</span>
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {viewingShelf.batches?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Batches on Shelf - Compact */}
              {viewingShelf.batches && viewingShelf.batches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Archive className="h-4 w-4 text-slate-600" />
                    <h3 className="font-semibold text-sm">Current Batches</h3>
                    <Badge className="ml-auto text-xs">{viewingShelf.batches.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {viewingShelf.batches.slice(0, 5).map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-2.5 rounded-md border bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{batch.drug?.brandName}</p>
                          <p className="text-xs text-muted-foreground">
                            Batch: {batch.batchNumber}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-sm">{batch.quantity}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(new Date(batch.expiryDate))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {viewingShelf.batches.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground py-1">
                        +{viewingShelf.batches.length - 5} more batches
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  className="flex-1 h-9"
                  onClick={() => {
                    setShelfToDelete(viewingShelf);
                    setShowDeleteConfirm(true);
                    setShowViewShelfDialog(false);
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete shelf &quot;{shelfToDelete?.shelfCode}&quot; and cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShelf}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
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
          {selectedBatch && (
            <div className="space-y-5 pt-2">
              {/* Medicine Header Card */}
              <Card className={cn(
                "border-2 shadow-sm",
                selectedBatch.daysUntilExpiry < 0 ? "border-red-500 bg-red-50" :
                selectedBatch.daysUntilExpiry <= 7 ? "border-red-400 bg-red-50" :
                selectedBatch.daysUntilExpiry <= 14 ? "border-orange-400 bg-orange-50" :
                selectedBatch.daysUntilExpiry <= 30 ? "border-amber-400 bg-amber-50" :
                "border-emerald-400 bg-emerald-50"
              )}>
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
                      <p className={cn(
                        "font-bold text-xl",
                        selectedBatch.daysUntilExpiry < 0 ? "text-red-600" :
                        selectedBatch.daysUntilExpiry <= 7 ? "text-red-600" :
                        selectedBatch.daysUntilExpiry <= 14 ? "text-orange-600" :
                        selectedBatch.daysUntilExpiry <= 30 ? "text-amber-600" :
                        "text-emerald-600"
                      )}>
                        {selectedBatch.daysUntilExpiry < 0
                          ? `Expired ${Math.abs(selectedBatch.daysUntilExpiry)}d ago`
                          : `${selectedBatch.daysUntilExpiry} days`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Status Alert Box */}
                  <div className={cn(
                    "p-4 rounded-lg border-l-4",
                    selectedBatch.daysUntilExpiry < 0 ? "bg-red-50 border-red-600" :
                    selectedBatch.daysUntilExpiry <= 7 ? "bg-red-50 border-red-500" :
                    selectedBatch.daysUntilExpiry <= 14 ? "bg-orange-50 border-orange-500" :
                    selectedBatch.daysUntilExpiry <= 30 ? "bg-amber-50 border-amber-500" :
                    "bg-emerald-50 border-emerald-500"
                  )}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={cn(
                        "h-5 w-5 mt-0.5 flex-shrink-0",
                        selectedBatch.daysUntilExpiry < 0 ? "text-red-600" :
                        selectedBatch.daysUntilExpiry <= 7 ? "text-red-600" :
                        selectedBatch.daysUntilExpiry <= 14 ? "text-orange-600" :
                        selectedBatch.daysUntilExpiry <= 30 ? "text-amber-600" :
                        "text-emerald-600"
                      )} />
                      <div className="space-y-1">
                        <p className={cn(
                          "text-sm font-bold",
                          selectedBatch.daysUntilExpiry < 0 ? "text-red-900" :
                          selectedBatch.daysUntilExpiry <= 7 ? "text-red-900" :
                          selectedBatch.daysUntilExpiry <= 14 ? "text-orange-900" :
                          selectedBatch.daysUntilExpiry <= 30 ? "text-amber-900" :
                          "text-emerald-900"
                        )}>
                          {selectedBatch.daysUntilExpiry < 0 ? "EXPIRED - IMMEDIATE ACTION REQUIRED" :
                          selectedBatch.daysUntilExpiry <= 7 ? "URGENT - EXPIRES WITHIN 7 DAYS" :
                          selectedBatch.daysUntilExpiry <= 14 ? "CRITICAL - EXPIRES WITHIN 14 DAYS" :
                          selectedBatch.daysUntilExpiry <= 30 ? "WARNING - EXPIRES WITHIN 30 DAYS" :
                          "NORMAL - SUFFICIENT TIME BEFORE EXPIRY"}
                        </p>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          selectedBatch.daysUntilExpiry < 0 ? "text-red-700" :
                          selectedBatch.daysUntilExpiry <= 7 ? "text-red-700" :
                          selectedBatch.daysUntilExpiry <= 14 ? "text-orange-700" :
                          selectedBatch.daysUntilExpiry <= 30 ? "text-amber-700" :
                          "text-emerald-700"
                        )}>
                          {selectedBatch.daysUntilExpiry < 0 ?
                            "This medicine has expired and must be removed from inventory immediately. Do not dispense to patients." :
                          selectedBatch.daysUntilExpiry <= 7 ?
                            "High priority: Consider returning to vendor or immediate sale with discount. Monitor daily." :
                          selectedBatch.daysUntilExpiry <= 14 ?
                            "Priority sale recommended. Contact vendor for return options or implement promotional pricing." :
                          selectedBatch.daysUntilExpiry <= 30 ?
                            "Monitor closely and consider promotional pricing to move stock before expiry." :
                          "Continue normal operations. Stock is within safe expiry range."}
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
                      <p className="font-semibold text-base">{selectedBatch.quantity} units</p>
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
                      <p className="font-semibold text-base font-mono text-sm">
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
                        Potential profit: {formatCurrency((selectedBatch.sellPrice - selectedBatch.purchasePrice) * selectedBatch.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBatchDetailsDialog(false)}
              className="flex-1"
            >
              Close
            </Button>
            {selectedBatch && selectedBatch.daysUntilExpiry <= 30 && (
              <Button
                className={cn(
                  "flex-1",
                  selectedBatch.daysUntilExpiry < 0 ? "bg-red-600 hover:bg-red-700" :
                  selectedBatch.daysUntilExpiry <= 7 ? "bg-red-600 hover:bg-red-700" :
                  selectedBatch.daysUntilExpiry <= 14 ? "bg-orange-600 hover:bg-orange-700" :
                  "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => {
                  // This would trigger the expiry action flow
                  setShowBatchDetailsDialog(false);
                  alert('Expiry management action triggered');
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Take Action
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
