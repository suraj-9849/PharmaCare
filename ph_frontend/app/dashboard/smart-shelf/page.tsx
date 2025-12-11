'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  ShelfLocation,
  InventoryBatch,
  IncorrectPickAlert,
  ShelfAnalytics,
  ExpiryActionType,
  CreateShelfLocationRequest,
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

// Icons
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  Archive,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trash2,
  Percent,
  CheckCircle2,
  XCircle,
  Grid3x3,
  Edit2,
  Eye,
  BarChart3,
  Zap,
} from 'lucide-react';

export default function SmartShelfPage() {
  // State
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<ShelfLocation | null>(null);
  const [analytics, setAnalytics] = useState<ShelfAnalytics | null>(null);
  const [expiringBatches, setExpiringBatches] = useState<InventoryBatch[]>([]);
  const [currentSwipeBatchIndex, setCurrentSwipeBatchIndex] = useState(0);
  const [alerts, setAlerts] = useState<IncorrectPickAlert[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [showAddShelfDialog, setShowAddShelfDialog] = useState(false);
  const [showEditShelfDialog, setShowEditShelfDialog] = useState(false);
  const [showViewShelfDialog, setShowViewShelfDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<IncorrectPickAlert | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('General');
  const [editingShelf, setEditingShelf] = useState<ShelfLocation | null>(null);
  const [viewingShelf, setViewingShelf] = useState<ShelfLocation | null>(null);
  const [deletingShelfId, setDeletingShelfId] = useState<string | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<ShelfLocation | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shelvesRes, analyticsRes, expiringRes, alertsRes] = await Promise.all([
        apiClient.smartShelf.getAllShelves({ limit: 100 }),
        apiClient.smartShelf.getAnalytics(),
        apiClient.smartShelf.getExpiringBatches({ days: 30, limit: 50 }),
        apiClient.smartShelf.getUnacknowledgedAlerts(10),
      ]);

      setShelves((shelvesRes.data as ShelfLocation[]) || []);
      setAnalytics(analyticsRes.data as ShelfAnalytics);
      setExpiringBatches((expiringRes.data as InventoryBatch[]) || []);
      setAlerts((alertsRes.data as IncorrectPickAlert[]) || []);
    } catch (err) {
      console.error('Error fetching smart shelf data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const shelvesByRow = useMemo(() => {
    const map: Record<string, ShelfLocation[]> = {};
    shelves.forEach((s) => {
      const rowKey = s.row ? String(s.row) : 'Unassigned';
      if (!map[rowKey]) map[rowKey] = [];
      map[rowKey].push(s);
    });

    const ordered = Object.keys(map).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    return ordered.map((rk) => ({
      row: rk,
      shelves: map[rk].sort((a, b) => String(a.column || '').localeCompare(String(b.column || ''))),
    }));
  }, [shelves]);

  const openShelfDetails = async (shelfIdOrObj: string | ShelfLocation) => {
    try {
      let id = typeof shelfIdOrObj === 'string' ? shelfIdOrObj : shelfIdOrObj.id;
      const res = await apiClient.smartShelf.getShelfById(id);
      const shelfData = (res.data as unknown) as ShelfLocation;
      setViewingShelf(shelfData);
      setShowViewShelfDialog(true);
    } catch (err) {
      console.error('Failed to fetch shelf details:', err);
      if (typeof shelfIdOrObj !== 'string') {
        setViewingShelf(shelfIdOrObj);
        setShowViewShelfDialog(true);
      }
    }
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

      // Move to next batch
      if (currentSwipeBatchIndex < expiringBatches.length - 1) {
        setCurrentSwipeBatchIndex(currentSwipeBatchIndex + 1);
      } else {
        // Refresh expiring batches
        const res = await apiClient.smartShelf.getExpiringBatches({ days: 30, limit: 50 });
        setExpiringBatches((res.data as InventoryBatch[]) || []);
        setCurrentSwipeBatchIndex(0);
      }
    } catch (err) {
      console.error('Error recording expiry action:', err);
    }
  };

  const handlePreviousBatch = () => {
    if (currentSwipeBatchIndex > 0) {
      setCurrentSwipeBatchIndex(currentSwipeBatchIndex - 1);
    }
  };

  const handleNextBatch = () => {
    if (currentSwipeBatchIndex < expiringBatches.length - 1) {
      setCurrentSwipeBatchIndex(currentSwipeBatchIndex + 1);
    }
  };

  // Alert handling
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

  // Get status badge color
  const getExpiryStatusBadge = (daysUntilExpiry?: number) => {
    if (!daysUntilExpiry) return null;

    if (daysUntilExpiry < 0) {
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700">
          Expired
        </Badge>
      );
    } else if (daysUntilExpiry <= 7) {
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700">
          {daysUntilExpiry}d left (Urgent)
        </Badge>
      );
    } else if (daysUntilExpiry <= 14) {
      return (
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">
          {daysUntilExpiry}d left (Critical)
        </Badge>
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
          {daysUntilExpiry}d left
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shelf Management</h1>
          <p className="text-sm text-slate-500">
            Visual shelf organization with First-Expiry-First-Out enforcement & intelligent inventory tracking
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingShelf(null);
            setSelectedZone('General');
            setShowAddShelfDialog(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Shelf
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shelves</CardTitle>
              <Package className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalShelves}</div>
              <p className="text-xs text-slate-500">{analytics.activeShelves} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Batches on Shelf</CardTitle>
              <Archive className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBatchesOnShelf}</div>
              <p className="text-xs text-slate-500">Across all shelves</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{analytics.expiringCount}</div>
              <p className="text-xs text-slate-500">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect Picks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.incorrectPickCount}</div>
              <p className="text-xs text-slate-500">Unacknowledged alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {analytics.topUtilizedShelves[0]?.utilizationPercentage.toFixed(0) || 0}%
              </div>
              <p className="text-xs text-slate-500">
                {analytics.topUtilizedShelves[0]?.shelfCode || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs - TabsList on Left, TabsContent on Right */}
      <Tabs defaultValue="shelves" className="w-full">
        <div className="flex gap-6 items-start">
          {/* TabsList on Left - Sidebar Navigation */}
          <div className="w-72 shrink-0 sticky top-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-800">Navigation</CardTitle>
                <CardDescription className="text-xs">Quick access to shelf tools</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <TabsList className="flex flex-col w-full gap-2 bg-transparent h-auto">
                  <TabsTrigger
                    value="swipe"
                    className="w-full justify-start gap-3 px-4 py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-slate-50 data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-100 transition-all duration-200"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Medicine Alert</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shelves"
                    className="w-full justify-start gap-3 px-4 py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-slate-50 data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-100 transition-all duration-200"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    <span>Shelf Map</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="alerts"
                    className="w-full justify-start gap-3 px-4 py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-slate-50 data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-100 transition-all duration-200"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="flex-1 text-left">Pick Alerts</span>
                    {alerts.length > 0 && (
                      <Badge className="ml-auto text-xs bg-red-500 text-white font-bold rounded-full px-2 py-0.5">
                        {alerts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </div>

          {/* TabsContent on Right */}
          <div className="flex-1 min-w-0">

        {/* FEFO Tinder-Style Swipe Tab */}
        <TabsContent value="swipe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Items - Quick Action</CardTitle>
              <CardDescription>
                Swipe right to return to vendor, swipe left to discount, or swipe down to dispose
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
                  <h3 className="text-lg font-semibold">No Expiring Items</h3>
                  <p className="text-sm text-slate-500">All batches are within safe expiry range</p>
                </div>
              ) : currentBatch ? (
                <div className="space-y-6">
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>
                      Item {currentSwipeBatchIndex + 1} of {expiringBatches.length}
                    </span>
                    <span>{Math.round(((currentSwipeBatchIndex + 1) / expiringBatches.length) * 100)}% Complete</span>
                  </div>

                  {/* Batch Card */}
                  <div className="relative rounded-lg border-2 border-slate-200 bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {currentBatch.drug?.brandName || 'Unknown Drug'}
                        </h3>
                        <p className="text-sm text-slate-500">{currentBatch.drug?.genericName}</p>
                        <p className="mt-1 text-xs text-slate-400">Batch: {currentBatch.batchNumber}</p>
                      </div>
                      {getExpiryStatusBadge(currentBatch.daysUntilExpiry)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="text-lg font-semibold">{currentBatch.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expiry Date</p>
                        <p className="text-lg font-semibold">{formatDate(new Date(currentBatch.expiryDate))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-lg font-semibold">{currentBatch.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(currentBatch.sellPrice * currentBatch.quantity)}</p>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePreviousBatch}
                        disabled={currentSwipeBatchIndex === 0}
                        className="h-12 w-12"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextBatch}
                        disabled={currentSwipeBatchIndex === expiringBatches.length - 1}
                        className="h-12 w-12"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleSwipe('RETURN_TO_VENDOR')}
                      className="h-20 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ArrowRight className="h-6 w-6" />
                      <span className="text-xs">Return to Vendor</span>
                    </Button>

                    <Button
                      onClick={() => handleSwipe('DISCOUNT')}
                      className="h-20 flex-col gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <Percent className="h-6 w-6" />
                      <span className="text-xs">Discount & Push</span>
                    </Button>

                    <Button
                      onClick={() => handleSwipe('DISPOSE')}
                      className="h-20 flex-col gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-6 w-6" />
                      <span className="text-xs">Dispose</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">No batches to review</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Shelf Map Tab - Enhanced Layout */}
        <TabsContent value="shelves" className="space-y-6">

          {shelves.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Grid3x3 className="mb-4 h-16 w-16 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900">No Shelves Created</h3>
                <p className="text-sm text-slate-500 mt-1">Create your first shelf location to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {shelvesByRow.map(({ row, shelves: rowShelves }) => (
                <div key={row} className="space-y-4">
                  {/* Row Header */}
                  <div className="flex items-center gap-4 px-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-md">
                        {row}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Row {row}</h3>
                        <p className="text-xs text-slate-500">{rowShelves.length} shelf location{rowShelves.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shelves Grid */}
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {rowShelves.map((shelf) => {
                      const util = Math.round(shelf.utilizationPercentage || 0);
                      const slots = Math.min(15, shelf.capacity || 15);
                      const levels = 3;
                      const perLevel = Math.ceil(slots / levels);

                      // populate slots by queuePosition
                      const slotBatches: (InventoryBatch | null)[] = Array.from({ length: slots }).map(() => null);
                      if (shelf.batches && shelf.batches.length > 0) {
                        shelf.batches.forEach((b) => {
                          const pos = typeof b.queuePosition === 'number' && b.queuePosition >= 0 && b.queuePosition < slots ? b.queuePosition : null;
                          if (pos !== null) {
                            slotBatches[pos] = b;
                          }
                        });

                        // Fill remaining with leftover batches
                        let fillIdx = 0;
                        shelf.batches.forEach((b) => {
                          if (typeof b.queuePosition !== 'number' || b.queuePosition === null || b.queuePosition < 0 || b.queuePosition >= slots) {
                            while (fillIdx < slots && slotBatches[fillIdx]) fillIdx++;
                            if (fillIdx < slots) {
                              slotBatches[fillIdx] = b;
                              fillIdx++;
                            }
                          }
                        });
                      }

                      // Determine shelf styling based on utilization
                      const shelfBgColor =
                        util > 90 ? 'bg-gradient-to-br from-red-50 to-red-100' :
                        util > 70 ? 'bg-gradient-to-br from-amber-50 to-amber-100' :
                        'bg-gradient-to-br from-slate-50 to-slate-100';

                      const shelfBorderColor =
                        util > 90 ? 'border-red-300' :
                        util > 70 ? 'border-amber-300' :
                        'border-slate-300';

                      return (
                        <Card key={shelf.id} className={cn('shadow-md hover:shadow-xl transition-all border-2', shelfBorderColor, shelfBgColor)}>
                          <CardContent className="p-5">
                            {/* Shelf Header */}
                            <div className="mb-5 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-lg shadow-lg border-2 border-slate-600">
                                  {shelf.shelfCode}
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-slate-900">{shelf.shelfName}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-slate-600 bg-white/60 px-2 py-0.5 rounded">
                                      Row {shelf.row || '—'}
                                    </span>
                                    <span className="text-xs font-medium text-slate-600 bg-white/60 px-2 py-0.5 rounded">
                                      Col {shelf.column || '—'}
                                    </span>
                                    {shelf.zone && shelf.zone !== 'General' && (
                                      <Badge variant="outline" className="text-xs font-semibold bg-white">
                                        {shelf.zone}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => openShelfDetails(shelf)} className="text-xs font-semibold bg-white hover:bg-slate-50">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>

                            {/* Utilization Section */}
                            <div className="mb-5 rounded-lg bg-white/70 p-3 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Capacity</span>
                                <span className={cn(
                                  'text-sm font-bold px-2.5 py-1 rounded-md',
                                  util > 90 ? 'text-red-700 bg-red-100 border border-red-300' :
                                  util > 70 ? 'text-amber-700 bg-amber-100 border border-amber-300' :
                                  'text-emerald-700 bg-emerald-100 border border-emerald-300'
                                )}>
                                  {util}%
                                </span>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-slate-200 border border-slate-300 overflow-hidden shadow-inner">
                                <div
                                  className={cn(
                                    'h-full transition-all duration-500',
                                    util > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    util > 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                    'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                  )}
                                  style={{ width: `${util}%` }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-600 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {shelf.currentStock || 0} items
                                </span>
                                <span>Max: {shelf.capacity || 0}</span>
                              </div>
                            </div>

                            {/* Physical Shelf Representation - 3D-like effect */}
                            <div className="rounded-xl bg-gradient-to-b from-slate-200 to-slate-300 p-4 border-2 border-slate-400 shadow-lg">
                              <div className="space-y-2">
                                {Array.from({ length: levels }).map((_, levelIdx) => (
                                  <div key={levelIdx} className="relative">
                                    {/* Level Label */}
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded shadow-sm">
                                        Level {levels - levelIdx}
                                      </span>
                                      <span className="text-xs text-slate-600 font-medium">
                                        {Array.from({ length: perLevel }).filter((__, posIdx) => {
                                          const slotIndex = levelIdx * perLevel + posIdx;
                                          return slotIndex < slots && slotBatches[slotIndex];
                                        }).length} / {Math.min(perLevel, slots - levelIdx * perLevel)} slots
                                      </span>
                                    </div>

                                    {/* Shelf Platform */}
                                    <div className="relative">
                                      {/* Background shelf bar */}
                                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-slate-400 to-slate-500 rounded-sm shadow-md" />

                                      {/* Slots */}
                                      <div className="flex gap-2 pb-2">
                                        {Array.from({ length: perLevel }).map((__, posIdx) => {
                                          const slotIndex = levelIdx * perLevel + posIdx;
                                          if (slotIndex >= slots) return <div key={posIdx} className="flex-1" />;
                                          const batch = slotBatches[slotIndex];
                                          const isFrontSlot = slotIndex === 0 && batch;
                                          const isExpiring = batch && batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry <= 7;
                                          const isExpired = batch && batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry < 0;

                                          let slotBg = 'bg-white/50 border-slate-300 border-dashed';
                                          let slotTextColor = 'text-slate-400';
                                          let slotShadow = '';

                                          if (batch) {
                                            if (isExpired) {
                                              slotBg = 'bg-gradient-to-br from-red-100 to-red-200 border-red-400';
                                              slotTextColor = 'text-red-800';
                                              slotShadow = 'shadow-md shadow-red-200';
                                            } else if (isExpiring) {
                                              slotBg = 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400';
                                              slotTextColor = 'text-amber-800';
                                              slotShadow = 'shadow-md shadow-amber-200';
                                            } else {
                                              slotBg = 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-400';
                                              slotTextColor = 'text-emerald-800';
                                              slotShadow = 'shadow-md shadow-emerald-200';
                                            }
                                            if (isFrontSlot) {
                                              slotShadow = 'shadow-lg shadow-blue-300 ring-2 ring-blue-500 ring-offset-1';
                                            }
                                          }

                                          return (
                                            <button
                                              key={posIdx}
                                              type="button"
                                              onClick={() => {
                                                if (batch) {
                                                  setSelectedBatch(batch);
                                                  setShowBatchDialog(true);
                                                } else {
                                                  openShelfDetails(shelf.id);
                                                }
                                              }}
                                              className={cn(
                                                'flex-1 min-h-20 rounded-md border-2 p-2.5 text-left flex flex-col justify-between hover:scale-105 transition-all relative font-medium cursor-pointer',
                                                slotBg,
                                                slotShadow
                                              )}
                                              title={batch ? `${batch.drug?.brandName} (Qty: ${batch.quantity}, Expires: ${formatDate(new Date(batch.expiryDate))})` : 'Empty slot - Click to view shelf'}
                                            >
                                              {isFrontSlot && (
                                                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white z-10" title="FEFO Front - Pick First">
                                                  ★
                                                </div>
                                              )}
                                              <div className={cn('text-xs font-bold truncate leading-tight', batch ? 'text-slate-900' : slotTextColor)}>
                                                {batch?.drug?.brandName ? batch.drug.brandName.substring(0, 10) : (batch ? 'Item' : '—')}
                                              </div>
                                              {batch && (
                                                <div className="mt-auto space-y-1">
                                                  <div className="flex items-center justify-between">
                                                    <span className={cn('text-xs font-bold', slotTextColor)}>
                                                      Qty: {batch.quantity}
                                                    </span>
                                                  </div>
                                                  {batch.daysUntilExpiry !== undefined && (
                                                    <div className={cn(
                                                      'text-xs font-bold px-1.5 py-0.5 rounded text-center',
                                                      batch.daysUntilExpiry < 0 ? 'bg-red-600 text-white' :
                                                      batch.daysUntilExpiry <= 7 ? 'bg-amber-600 text-white' :
                                                      'bg-emerald-600 text-white'
                                                    )}>
                                                      {batch.daysUntilExpiry < 0 ? 'EXP' : `${batch.daysUntilExpiry}d`}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Footer */}
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                              <Badge className={cn(
                                'text-xs font-semibold',
                                shelf.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-500'
                              )}>
                                {shelf.status}
                              </Badge>
                              {util > 90 && (
                                <Badge className="text-xs bg-red-600 text-white font-semibold">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Critical Level
                                </Badge>
                              )}
                              {util > 70 && util <= 90 && (
                                <Badge className="text-xs bg-amber-600 text-white font-semibold">
                                  High Utilization
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
                <h3 className="text-lg font-semibold">No Incorrect Pick Alerts</h3>
                <p className="text-sm text-slate-500">All picks are correct</p>
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
                      <p className="mt-1 text-sm text-slate-600">
                        Shelf: <span className="font-medium">{alert.shelfLocation?.shelfCode}</span>
                      </p>
                      <p className="text-xs text-slate-500">
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
          </div>
        </div>
      </Tabs>

      {/* Add/Edit Shelf Dialog */}
      <Dialog open={showAddShelfDialog || showEditShelfDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddShelfDialog(false);
          setShowEditShelfDialog(false);
          setEditingShelf(null);
          setSelectedZone('General');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingShelf ? 'Edit Shelf Location' : 'Add New Shelf Location'}</DialogTitle>
            <DialogDescription>
              {editingShelf ? 'Update shelf location details.' : 'Create a new shelf location for organizing inventory batches.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              const shelfCode = formData.get('shelfCode') as string;
              const shelfName = formData.get('shelfName') as string;
              const row = formData.get('row') as string;
              const column = formData.get('column') as string;
              const capacity = formData.get('capacity') as string;
              const qrCode = formData.get('qrCode') as string;
              const notes = formData.get('notes') as string;

              const data: CreateShelfLocationRequest = {
                shelfCode,
                shelfName,
                row: row || undefined,
                column: column || undefined,
                zone: selectedZone || undefined,
                capacity: capacity ? parseInt(capacity) : 50,
                qrCode: qrCode || undefined,
                notes: notes || undefined,
              };

              try {
                if (editingShelf) {
                  // Update existing shelf
                  await apiClient.smartShelf.updateShelf(editingShelf.id, data);
                  alert('Shelf updated successfully!');
                } else {
                  // Create new shelf
                  await apiClient.smartShelf.createShelf(data);
                  alert('Shelf created successfully!');
                }

                // Reset form and close dialog
                const form = e.currentTarget;
                if (form) {
                  form.reset();
                }
                setSelectedZone('General');
                setShowAddShelfDialog(false);
                setShowEditShelfDialog(false);
                setEditingShelf(null);

                // Refresh data
                fetchData();
              } catch (err: any) {
                console.error('Error saving shelf:', err);
                let errorMessage = err.message || 'Failed to save shelf';

                if (errorMessage.includes('Unique constraint') || errorMessage.includes('shelf_code')) {
                  errorMessage = `A shelf with code "${shelfCode}" already exists. Please use a different shelf code.`;
                }

                alert(`Error: ${errorMessage}`);
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelfCode">Shelf Code *</Label>
                  <Input
                    id="shelfCode"
                    name="shelfCode"
                    placeholder="A1, B2, C3..."
                    defaultValue={editingShelf?.shelfCode || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfName">Shelf Name *</Label>
                  <Input
                    id="shelfName"
                    name="shelfName"
                    placeholder="Main Shelf A"
                    defaultValue={editingShelf?.shelfName || ''}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="row">Row</Label>
                  <Input 
                    id="row" 
                    name="row" 
                    placeholder="1"
                    defaultValue={editingShelf?.row || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="column">Column</Label>
                  <Input 
                    id="column" 
                    name="column" 
                    placeholder="A"
                    defaultValue={editingShelf?.column || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    placeholder="50"
                    defaultValue={editingShelf?.capacity || 50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="Controlled">Controlled Substances</SelectItem>
                    <SelectItem value="Hazardous">Hazardous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qrCode">QR Code (optional)</Label>
                <Input 
                  id="qrCode" 
                  name="qrCode" 
                  placeholder="QR-SHELF-A1"
                  defaultValue={editingShelf?.qrCode || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  name="notes" 
                  placeholder="Additional notes..."
                  defaultValue={editingShelf?.notes || ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddShelfDialog(false);
                  setShowEditShelfDialog(false);
                  setEditingShelf(null);
                  setSelectedZone('General');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingShelf ? 'Update Shelf' : 'Create Shelf'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Shelf Details Dialog */}
      <Dialog open={showViewShelfDialog} onOpenChange={setShowViewShelfDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Shelf Details</DialogTitle>
            <DialogDescription>{viewingShelf?.shelfCode} - {viewingShelf?.shelfName}</DialogDescription>
          </DialogHeader>
          {viewingShelf && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600">Shelf Code</p>
                  <p className="text-lg font-bold text-slate-900">{viewingShelf.shelfCode}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-lg font-bold text-slate-900">{viewingShelf.status}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-slate-600">Shelf Name</p>
                <p className="text-lg font-bold text-slate-900">{viewingShelf.shelfName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600">Capacity</p>
                  <p className="text-lg font-bold text-slate-900">{viewingShelf.capacity}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600">Current Stock</p>
                  <p className="text-lg font-bold text-slate-900">{viewingShelf.currentStock || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600">Utilization</p>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${viewingShelf.utilizationPercentage || 0}%` }}
                  />
                </div>
                <p className="text-right text-sm font-semibold text-slate-900">
                  {(viewingShelf.utilizationPercentage || 0).toFixed(1)}%
                </p>
              </div>

              {viewingShelf.zone && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">Zone</p>
                  <p className="text-lg font-bold text-slate-900">{viewingShelf.zone}</p>
                </div>
              )}

              {(viewingShelf.row || viewingShelf.column) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-slate-600">Row</p>
                    <p className="text-lg font-bold text-slate-900">{viewingShelf.row || '-'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-slate-600">Column</p>
                    <p className="text-lg font-bold text-slate-900">{viewingShelf.column || '-'}</p>
                  </div>
                </div>
              )}

              {viewingShelf.qrCode && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600">QR Code</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{viewingShelf.qrCode}</p>
                </div>
              )}

              {viewingShelf.notes && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">Notes</p>
                  <p className="text-slate-900">{viewingShelf.notes}</p>
                </div>
              )}

              {/* Shelf Replica Visualization */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Shelf Replica</h3>
                <p className="text-xs text-slate-500">Visual layout representing levels and slots. Click a slot to view batch details.</p>

                <div className="mt-3 rounded-lg border bg-white p-3 shadow-sm">
                  {/* 3 levels x 5 positions (editable) */}
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, levelIdx) => (
                      <div key={levelIdx} className="flex gap-2">
                        {Array.from({ length: 5 }).map((__, posIdx) => {
                          const slotIndex = levelIdx * 5 + posIdx;
                          const batch = viewingShelf?.batches && viewingShelf.batches[slotIndex];
                          return (
                            <button
                              key={posIdx}
                              type="button"
                              onClick={() => {
                                if (batch) {
                                  setSelectedBatch(batch);
                                  setShowBatchDialog(true);
                                } else {
                                  // show placeholder info
                                  setSelectedBatch(null);
                                  setShowBatchDialog(true);
                                }
                              }}
                              className={cn(
                                'flex-1 min-h-16 rounded border p-2 text-left flex flex-col justify-between',
                                batch
                                  ? 'bg-white hover:shadow-md'
                                  : 'bg-slate-50 border-dashed text-slate-400'
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="text-xs font-semibold text-slate-900 truncate">{batch?.drug?.brandName || (batch ? 'Unnamed Drug' : 'Empty')}</div>
                                {batch && (
                                  <div className="text-[10px] text-slate-500">B: {batch.batchNumber}</div>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-xs text-slate-500">{batch ? `${batch.quantity} units` : '—'}</div>
                                <div className="text-xs">
                                  {batch ? getExpiryStatusBadge(batch.daysUntilExpiry) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewShelfDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Detail Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              Details for the selected batch or empty slot.
            </DialogDescription>
          </DialogHeader>
          {selectedBatch ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Drug</p>
                <p className="text-lg font-bold text-slate-900">{selectedBatch.drug?.brandName || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{selectedBatch.drug?.genericName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-slate-500">Batch</p>
                  <p className="text-lg font-bold text-slate-900">{selectedBatch.batchNumber}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-slate-500">Quantity</p>
                  <p className="text-lg font-bold text-slate-900">{selectedBatch.quantity}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">Expiry</p>
                <p className="text-lg font-bold text-slate-900">{formatDate(new Date(selectedBatch.expiryDate))}</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">Empty slot — no batch assigned</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shelf?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete shelf <strong>{shelfToDelete?.shelfCode}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingShelfId) return;

                try {
                  await apiClient.smartShelf.deleteShelf(deletingShelfId);
                  alert('Shelf deleted successfully!');
                  setShowDeleteConfirm(false);
                  setDeletingShelfId(null);
                  setShelfToDelete(null);
                  fetchData();
                } catch (err: any) {
                  console.error('Error deleting shelf:', err);
                  alert(`Error: ${err.message || 'Failed to delete shelf'}`);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Review Dialog */}
      <AlertDialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incorrect Pick Alert</AlertDialogTitle>
            <AlertDialogDescription>
              A pharmacist picked the wrong batch. Please review and acknowledge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {currentAlert && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">FEFO Violation Detected</p>
                <p className="mt-2 text-xs text-red-700">
                  The pharmacist should have picked the batch at the front of the queue (oldest expiry) but picked a different one instead.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Shelf:</span> {currentAlert.shelfLocation?.shelfCode}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {formatDate(new Date(currentAlert.createdAt))}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => currentAlert && handleAcknowledgeAlert(currentAlert.id)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
