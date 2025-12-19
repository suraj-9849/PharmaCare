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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
} from 'lucide-react';

// Mock batch data
const generateMockBatches = (shelfId: string, startSlot: number, count: number) => {
  const medicines = [
    { brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', qty: 100 },
    { brand: 'Lisinopril 10mg', generic: 'Lisinopril', qty: 75 },
    { brand: 'Atorvastatin 20mg', generic: 'Atorvastatin', qty: 120 },
    { brand: 'Metformin 850mg', generic: 'Metformin', qty: 90 },
    { brand: 'Omeprazole 40mg', generic: 'Omeprazole', qty: 60 },
  ];

  const today = new Date();
  const batches = [];
  const expiryScenarios = [
    { days: -5, status: 'expired' },
    { days: 3, status: 'urgent' },
    { days: 10, status: 'critical' },
    { days: 20, status: 'warning' },
    { days: 60, status: 'normal' },
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
      isExpired: scenario.days < 0,
      isExpiringSoon: scenario.days >= 0 && scenario.days <= 30,
      drug: {
        brandName: medicine.brand,
        genericName: medicine.generic,
        id: `drug-${i + 1}`,
        category: 'General',
        manufacturer: 'Generic Pharma',
        requiresPrescription: false,
        reorderLevel: 50,
        sku: `SKU-${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } satisfies InventoryBatch);
  }

  return batches;
};

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
];

export default function SmartShelfPage() {
  const [shelves, setShelves] = useState<ShelfLocation[]>(mockShelves);
  const [analytics, setAnalytics] = useState<ShelfAnalytics | null>(null);
  const [expiringBatches, setExpiringBatches] = useState<InventoryBatch[]>([]);
  const [currentSwipeBatchIndex, setCurrentSwipeBatchIndex] = useState(0);
  const [alerts, setAlerts] = useState<IncorrectPickAlert[]>([]);

  const [isLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewingShelf, setViewingShelf] = useState<ShelfLocation | null>(null);
  const [editingShelf, setEditingShelf] = useState<ShelfLocation | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddShelfDialog, setShowAddShelfDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEditShelfDialog, setShowEditShelfDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showViewShelfDialog, setShowViewShelfDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAlertModal, setShowAlertModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentAlert, setCurrentAlert] = useState<IncorrectPickAlert | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<ShelfLocation | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showBatchDetailsDialog, setShowBatchDetailsDialog] = useState(false);

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

  useEffect(() => {
    const allBatches = shelves.flatMap((s) => s.batches || []);
    const expiringBatches = allBatches.filter((b) => (b.daysUntilExpiry ?? 999) <= 30);

    setAnalytics({
      totalShelves: shelves.length,
      activeShelves: shelves.filter((s) => s.status === 'ACTIVE').length,
      totalBatchesOnShelf: allBatches.length,
      expiringCount: expiringBatches.length,
      incorrectPickCount: 0,
      topUtilizedShelves: shelves
        .sort((a, b) => (b.utilizationPercentage ?? 0) - (a.utilizationPercentage ?? 0))
        .slice(0, 3)
        .map((s) => ({
          shelfCode: s.shelfCode,
          shelfName: s.shelfName,
          currentStock: s.currentStock || 0,
          capacity: s.capacity || 0,
          utilizationPercentage: s.utilizationPercentage || 0,
        })),
    });

    setExpiringBatches(expiringBatches);
  }, [shelves]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateShelf = async () => {
    setIsSaving(true);
    try {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateShelf = async () => {
    if (!editingShelf) return;
    setIsSaving(true);
    try {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteShelf = async () => {
    if (!shelfToDelete) return;
    try {
      setShelves(shelves.filter((s) => s.id !== shelfToDelete.id));
      setShowDeleteConfirm(false);
      setShelfToDelete(null);
    } catch (err) {
      console.error('Error deleting shelf:', err);
      alert('Failed to delete shelf');
    }
  };

  const openShelfDetails = async (shelf: ShelfLocation) => {
    setViewingShelf(shelf);
    setShowViewShelfDialog(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSlotClick = (batch: InventoryBatch) => {
    setSelectedBatch(batch);
    setShowBatchDetailsDialog(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Smart Shelf Management
          </h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Visual inventory tracking with intelligent expiry management
          </p>
        </div>
        <Button
          onClick={() => setShowAddShelfDialog(true)}
          size="lg"
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all font-bold"
        >
          <Plus className="h-5 w-5" />
          Add Shelf
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-700">Total Shelves</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Package className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{analytics.totalShelves}</div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {analytics.activeShelves} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-700">Active Batches</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
                <Archive className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {analytics.totalBatchesOnShelf}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">Across all shelves</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-700">Expiring Soon</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-700">{analytics.expiringCount}</div>
              <p className="text-xs text-slate-600 font-semibold mt-1">Next 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-700">Top Utilization</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-700">
                {analytics.topUtilizedShelves?.[0]?.utilizationPercentage?.toFixed(0) || 0}%
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {analytics.topUtilizedShelves?.[0]?.shelfCode || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="shelves" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-slate-100">
          <TabsTrigger
            value="shelves"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold"
          >
            <Grid3x3 className="h-4 w-4" />
            Shelves
          </TabsTrigger>
          <TabsTrigger
            value="swipe"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white font-bold"
          >
            <Zap className="h-4 w-4" />
            Expiring
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white font-bold"
          >
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
        <TabsContent value="shelves" className="space-y-6 mt-8">
          {shelves.length === 0 ? (
            <Card className="border-dashed border-2">
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shelves.map((shelf) => {
                const util = Math.round(shelf.utilizationPercentage || 0);

                return (
                  <Card
                    key={shelf.id}
                    className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-indigo-50 via-white to-purple-50"
                    onClick={() => openShelfDetails(shelf)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <CardContent className="p-6 relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                              {shelf.shelfCode}
                            </div>
                            {shelf.status === 'ACTIVE' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg text-slate-900 truncate mb-1">
                              {shelf.shelfName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Grid3x3 className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {shelf.row}×{shelf.column} Grid
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Utilization Bar */}
                      <div className="space-y-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Utilization
                          </span>
                          <span
                            className={cn(
                              'text-base font-black px-3 py-1 rounded-lg',
                              util > 90
                                ? 'text-rose-700 bg-rose-100'
                                : util > 70
                                  ? 'text-amber-700 bg-amber-100'
                                  : 'text-emerald-700 bg-emerald-100'
                            )}
                          >
                            {util}%
                          </span>
                        </div>

                        <div className="relative h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-700 rounded-full',
                              util > 90
                                ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                                : util > 70
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            )}
                            style={{ width: `${util}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-indigo-600" />
                            {shelf.currentStock || 0} / {shelf.capacity || 0}
                          </span>
                          <span className="text-slate-500">
                            {(shelf.capacity || 0) - (shelf.currentStock || 0)} free
                          </span>
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
        <TabsContent value="swipe" className="mt-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-amber-600 to-orange-600">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Clock className="h-6 w-6" />
                Expiring Items - Quick Action
              </CardTitle>
              <CardDescription className="text-amber-50">
                Review and take action on expiring inventory batches
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {expiringBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No Expiring Items</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    All batches are within safe expiry range.
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
                          style={{
                            width: `${((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {Math.round(((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100)}%
                      Complete
                    </Badge>
                  </div>

                  {/* Medicine Card */}
                  <Card
                    className={cn(
                      'relative border-2 shadow-lg overflow-hidden',
                      (currentBatch.daysUntilExpiry ?? 999) < 0
                        ? 'border-red-500 bg-red-50'
                        : (currentBatch.daysUntilExpiry ?? 999) <= 7
                          ? 'border-red-400 bg-red-50'
                          : (currentBatch.daysUntilExpiry ?? 999) <= 14
                            ? 'border-orange-400 bg-orange-50'
                            : (currentBatch.daysUntilExpiry ?? 999) <= 30
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-slate-300 bg-white'
                    )}
                  >
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
                          {getExpiryStatusBadge(currentBatch.daysUntilExpiry)}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 p-5 rounded-lg bg-white/80 border border-slate-200 shadow-sm">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Quantity
                          </Label>
                          <p className="text-xl font-bold text-slate-900">
                            {currentBatch.quantity} units
                          </p>
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
                          <p className="text-lg font-semibold text-slate-700">
                            {currentBatch.location || 'N/A'}
                          </p>
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
        <TabsContent value="alerts" className="space-y-4 mt-8">
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

      {/* Dialogs and Sheets will continue in next part... */}
    </div>
  );
}
