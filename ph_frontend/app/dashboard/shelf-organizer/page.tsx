'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Package,
  Archive,
  Search,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';

// Types
interface Drug {
  id: string;
  brandName: string;
  genericName: string;
}

interface InventoryBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  quantity: number;
  assignedQuantity: number;
  unassignedQuantity?: number;
  expiryDate: string;
  drug: Drug;
}

interface RackItem {
  id: string;
  shelfId: string;
  drugId: string;
  batchId: string;
  quantity: number;
  drug: Drug;
  batch: InventoryBatch;
}

interface Rack {
  id: string;
  cupboardId: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  order: number;
  shelfItems: RackItem[];
}

interface Shelf {
  id: string;
  name: string;
  description?: string;
  order: number;
  shelves: Rack[];
}

export default function ShelfOrganizerPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [unassignedInventory, setUnassignedInventory] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');

  // Dialog states
  const [showShelfDialog, setShowShelfDialog] = useState(false);
  const [showRackDialog, setShowRackDialog] = useState(false);
  const [showDeleteShelfDialog, setShowDeleteShelfDialog] = useState(false);
  const [showDeleteRackDialog, setShowDeleteRackDialog] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<string>('');
  const [rackToDelete, setRackToDelete] = useState<string>('');
  const [shelfName, setShelfName] = useState('');
  const [shelfDescription, setShelfDescription] = useState('');
  const [rackName, setRackName] = useState('');
  const [rackCapacity, setRackCapacity] = useState('500');

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{
    batch: InventoryBatch;
    quantity: number;
  } | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({});
  const [dragOverRackId, setDragOverRackId] = useState<string | null>(null);

  // Remove/Move dialog states
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedRackItem, setSelectedRackItem] = useState<RackItem | null>(null);
  const [removeQuantity, setRemoveQuantity] = useState('');
  const [targetRackId, setTargetRackId] = useState('');

  // Rack display states
  const [draggedRack, setDraggedRack] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shelvesRes, inventoryRes] = await Promise.all([
        apiClient.get<{ data: Shelf[] }>('/shelf-management/cupboards'),
        apiClient.get<{ data: InventoryBatch[] }>('/shelf-management/unassigned'),
      ]);

      setShelves(shelvesRes.data || []);
      setUnassignedInventory(inventoryRes.data || []);

      // Select first shelf by default
      if (shelvesRes.data && shelvesRes.data.length > 0 && !selectedShelfId) {
        setSelectedShelfId(shelvesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load shelf data');
    } finally {
      setLoading(false);
    }
  };

  const createShelf = async () => {
    if (!shelfName.trim()) {
      toast.error('Please enter a shelf name');
      return;
    }

    try {
      await apiClient.post('/shelf-management/cupboards', {
        name: shelfName,
        description: shelfDescription,
      });

      toast.success('Shelf created successfully');
      setShowShelfDialog(false);
      setShelfName('');
      setShelfDescription('');
      loadData();
    } catch (error) {
      console.error('Error creating shelf:', error);
      toast.error('Failed to create shelf');
    }
  };

  const createRack = async () => {
    if (!rackName.trim() || !selectedShelfId) {
      toast.error('Please fill all fields');
      return;
    }

    const capacity = parseInt(rackCapacity);
    if (isNaN(capacity) || capacity <= 0) {
      toast.error('Please enter a valid capacity');
      return;
    }

    try {
      await apiClient.post('/shelf-management/shelves', {
        cupboardId: selectedShelfId,
        name: rackName,
        capacity,
      });

      toast.success('Rack created successfully');
      setShowRackDialog(false);
      setRackName('');
      setRackCapacity('500');
      loadData();
    } catch (error) {
      console.error('Error creating rack:', error);
      toast.error('Failed to create rack');
    }
  };

  const deleteShelf = async () => {
    if (!shelfToDelete) return;

    try {
      await apiClient.delete(`/shelf-management/cupboards/${shelfToDelete}`);
      toast.success('Shelf deleted successfully');
      setShowDeleteShelfDialog(false);
      setShelfToDelete('');

      // If deleted shelf was selected, select another one
      if (selectedShelfId === shelfToDelete) {
        setSelectedShelfId('');
      }
      loadData();
    } catch (error: any) {
      console.error('Error deleting shelf:', error);
      toast.error(error.response?.data?.message || 'Failed to delete shelf');
    }
  };

  const deleteRack = async () => {
    if (!rackToDelete) return;

    try {
      await apiClient.delete(`/shelf-management/shelves/${rackToDelete}`);
      toast.success('Rack deleted successfully');
      setShowDeleteRackDialog(false);
      setRackToDelete('');
      loadData();
    } catch (error: any) {
      console.error('Error deleting rack:', error);
      toast.error(error.response?.data?.message || 'Failed to delete rack');
    }
  };

  const handleDragStart = (e: React.DragEvent, batch: InventoryBatch) => {
    const qty = selectedQuantity[batch.id] || Math.min(50, batch.unassignedQuantity || 0);
    setDraggedItem({ batch, quantity: qty });

    // Set custom cursor/drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';

    // Create a custom drag image
    const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-10000px';
    dragElement.style.left = '-10000px';
    dragElement.style.width = (e.currentTarget as HTMLElement).offsetWidth + 'px';
    dragElement.style.opacity = '0.9';
    dragElement.style.transform = 'rotate(5deg) scale(1.05)';
    dragElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
    dragElement.style.borderRadius = '12px';
    dragElement.style.border = '3px solid #3b82f6';
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, 75, 50);
    setTimeout(() => {
      if (document.body.contains(dragElement)) {
        document.body.removeChild(dragElement);
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, rackId?: string) => {
    e.preventDefault();
    if (rackId && draggedItem) {
      setDragOverRackId(rackId);
    }
  };

  const handleDragLeave = () => {
    setDragOverRackId(null);
  };

  const handleDrop = async (e: React.DragEvent, rackId: string) => {
    e.preventDefault();
    setDragOverRackId(null);
    if (!draggedItem) return;

    try {
      await apiClient.post('/shelf-management/assign', {
        shelfId: rackId,
        batchId: draggedItem.batch.id,
        quantity: draggedItem.quantity,
      });

      toast.success(`Assigned ${draggedItem.quantity} units to rack`);
      setDraggedItem(null);
      setSelectedQuantity({});
      loadData();
    } catch (error: any) {
      console.error('Error assigning to rack:', error);
      toast.error(error.response?.data?.message || 'Failed to assign items');
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverRackId(null);
  };

  const selectedShelf = shelves.find((c) => c.id === selectedShelfId);

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getShelfColor = (percentage: number) => {
    if (percentage >= 90)
      return 'bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-rose-300';
    if (percentage >= 70)
      return 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300';
    if (percentage >= 40)
      return 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border-sky-300';
    return 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-300';
  };

  const getDrugBoxColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-violet-50 to-violet-100 border-violet-300 text-violet-900',
      'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-fuchsia-300 text-fuchsia-900',
      'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900',
      'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900',
      'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900',
      'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-900',
      'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-300 text-teal-900',
      'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-300 text-pink-900',
    ];
    return colors[index % colors.length];
  };

  const handleRemoveItems = async () => {
    if (!selectedRackItem) return;

    const qty = parseInt(removeQuantity);
    if (isNaN(qty) || qty <= 0 || qty > selectedRackItem.quantity) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await apiClient.post('/shelf-management/remove', {
        shelfItemId: selectedRackItem.id,
        quantity: qty,
      });

      toast.success(`Removed ${qty} units from rack`);
      setShowRemoveDialog(false);
      setSelectedRackItem(null);
      setRemoveQuantity('');
      loadData();
    } catch (error: any) {
      console.error('Error removing items:', error);
      toast.error(error.response?.data?.message || 'Failed to remove items');
    }
  };

  const handleMoveItems = async () => {
    if (!selectedRackItem || !targetRackId) {
      toast.error('Please select a target rack');
      return;
    }

    const qty = parseInt(removeQuantity);
    if (isNaN(qty) || qty <= 0 || qty > selectedRackItem.quantity) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await apiClient.post('/shelf-management/move', {
        fromShelfId: selectedRackItem.shelfId,
        toShelfId: targetRackId,
        batchId: selectedRackItem.batchId,
        quantity: qty,
      });

      toast.success(`Moved ${qty} units to target rack`);
      setShowMoveDialog(false);
      setSelectedRackItem(null);
      setRemoveQuantity('');
      setTargetRackId('');
      loadData();
    } catch (error: any) {
      console.error('Error moving items:', error);
      toast.error(error.response?.data?.message || 'Failed to move items');
    }
  };

  const handleRackDragStart = (rackId: string) => {
    setDraggedRack(rackId);
  };

  const handleRackDragOver = (e: React.DragEvent, targetRackId: string) => {
    e.preventDefault();
    if (draggedRack && draggedRack !== targetRackId) {
      e.currentTarget.classList.add('border-blue-500', 'border-2');
    }
  };

  const handleRackDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'border-2');
  };

  const handleRackDrop = async (e: React.DragEvent, targetRackId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'border-2');

    if (!draggedRack || draggedRack === targetRackId || !selectedShelf) {
      return;
    }

    try {
      const draggedRackObj = selectedShelf.shelves.find((s) => s.id === draggedRack);
      const targetRackObj = selectedShelf.shelves.find((s) => s.id === targetRackId);

      if (!draggedRackObj || !targetRackObj) return;

      // Reorder by swapping orders
      await Promise.all([
        apiClient.put(`/shelf-management/shelves/${draggedRack}`, {
          order: targetRackObj.order,
        }),
        apiClient.put(`/shelf-management/shelves/${targetRackId}`, {
          order: draggedRackObj.order,
        }),
      ]);

      toast.success('Rack reordered successfully');
      setDraggedRack(null);
      loadData();
    } catch (error: any) {
      console.error('Error reordering racks:', error);
      toast.error(error.response?.data?.message || 'Failed to reorder racks');
    }
  };

  const filteredInventory = unassignedInventory.filter((batch) => {
    const query = searchQuery.toLowerCase();
    return (
      batch.drug.brandName.toLowerCase().includes(query) ||
      batch.drug.genericName.toLowerCase().includes(query) ||
      batch.batchNumber.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading shelf organizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shelf Organizer</h1>
            <p className="text-sm text-muted-foreground">
              Organize your inventory with drag and drop
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 p-6 min-h-0 overflow-hidden">
        {/* LEFT SIDE - Unassigned Inventory */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Unassigned Inventory
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {unassignedInventory.length} batches available
                </p>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 min-h-0 overflow-y-scroll">
            <div className="space-y-3 pr-2">
              {filteredInventory.map((batch) => {
                const unassigned = batch.unassignedQuantity || 0;
                const maxQty = Math.min(unassigned, 1000);
                const currentQty = selectedQuantity[batch.id] || Math.min(50, unassigned);

                return (
                  <div
                    key={batch.id}
                    draggable={unassigned > 0}
                    onDragStart={(e) => handleDragStart(e, batch)}
                    onDragEnd={handleDragEnd}
                    className={`
                        border-2 rounded-xl p-4 transition-all duration-300
                        ${
                          unassigned > 0
                            ? 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-slate-400 hover:scale-[1.02] bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-slate-200'
                            : 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                        }
                        ${draggedItem?.batch.id === batch.id ? 'opacity-20 scale-95' : ''}
                      `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{batch.drug.brandName}</h3>
                        <p className="text-xs text-gray-500">{batch.drug.genericName}</p>
                      </div>
                      {unassigned > 0 && <GripVertical className="h-4 w-4 text-gray-400" />}
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="text-xs text-gray-500">Batch: {batch.batchNumber}</div>
                      <Badge variant={unassigned > 0 ? 'default' : 'secondary'} className="text-xs">
                        {unassigned} available
                      </Badge>
                    </div>

                    {unassigned > 0 && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs">Quantity to assign: {currentQty}</Label>
                        <input
                          type="range"
                          min="1"
                          max={maxQty}
                          value={currentQty}
                          onChange={(e) =>
                            setSelectedQuantity({
                              ...selectedQuantity,
                              [batch.id]: parseInt(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No unassigned inventory</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT SIDE - Shelves and Racks */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0 border-b">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Archive className="h-5 w-5" />
                Storage Organization
              </CardTitle>
              <Button size="sm" onClick={() => setShowShelfDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Shelf
              </Button>
            </div>

            {/* Shelf Selector */}
            {shelves.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 border rounded-md p-2 text-sm h-9"
                  value={selectedShelfId}
                  onChange={(e) => setSelectedShelfId(e.target.value)}
                >
                  {shelves.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shelves.length} racks)
                    </option>
                  ))}
                </select>
                {selectedShelf && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 h-9 w-9 p-0"
                    onClick={() => {
                      setShelfToDelete(selectedShelf.id);
                      setShowDeleteShelfDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-4 min-h-0 overflow-y-scroll">
            {selectedShelf ? (
              <div className="space-y-4">
                {/* Shelf Header */}
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 sticky top-0 z-10 border-2 border-slate-200 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800">{selectedShelf.name}</h3>
                      {selectedShelf.description && (
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          {selectedShelf.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowRackDialog(true)}
                      className="h-9 bg-slate-700 hover:bg-slate-800 shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rack
                    </Button>
                  </div>
                </div>

                {/* Racks Display - Stacked like real racks */}
                <div className="space-y-4">
                  {selectedShelf.shelves
                    .sort((a, b) => a.order - b.order)
                    .map((rack) => {
                      const percentage = (rack.currentOccupancy / rack.capacity) * 100;
                      const isBeingDraggedOver = dragOverRackId === rack.id;
                      return (
                        <div
                          key={rack.id}
                          className={`
                              relative transition-all duration-300
                              ${draggedRack === rack.id ? 'opacity-50' : ''}
                            `}
                        >
                          {/* Rack Header */}
                          <div
                            className="flex items-center justify-between mb-2 px-2"
                            draggable
                            onDragStart={() => handleRackDragStart(rack.id)}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                              <h4 className="font-semibold text-sm">{rack.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getCapacityColor(percentage)}`}
                              >
                                {percentage.toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {rack.currentOccupancy}/{rack.capacity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRackToDelete(rack.id);
                                  setShowDeleteRackDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Actual Rack with 3D effect */}
                          <div
                            onDragOver={(e) => {
                              handleDragOver(e, rack.id);
                              handleRackDragOver(e, rack.id);
                            }}
                            onDragLeave={(e) => {
                              handleDragLeave();
                              handleRackDragLeave(e);
                            }}
                            onDrop={(e) => {
                              handleDrop(e, rack.id);
                              handleRackDrop(e, rack.id);
                            }}
                            className={`
                                relative rounded-xl border-2 overflow-hidden
                                transition-all duration-300 shadow-md
                                ${getShelfColor(percentage)}
                                ${
                                  isBeingDraggedOver
                                    ? 'border-blue-400 shadow-2xl scale-[1.02] ring-4 ring-blue-200/50'
                                    : 'hover:shadow-lg hover:scale-[1.01]'
                                }
                              `}
                          >
                            {/* Rack top border - sleek metal effect */}
                            <div className="h-2.5 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-b border-slate-900/20 shadow-sm relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </div>

                            {/* Rack content area */}
                            <div className="p-4 min-h-[120px]">
                              {rack.shelfItems.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                  {rack.shelfItems.map((item, index) => (
                                    <div key={item.id} className="group relative">
                                      {/* Drug box on shelf */}
                                      <div
                                        className={`
                                          border-2 rounded-lg shadow-md
                                          p-3 min-w-[140px] max-w-[160px]
                                          hover:shadow-xl hover:scale-105 transition-all duration-200
                                          cursor-pointer relative overflow-hidden
                                          ${getDrugBoxColor(index)}
                                        `}
                                      >
                                        {/* Subtle shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent pointer-events-none"></div>

                                        <div className="flex items-start justify-between mb-1 relative z-10">
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-xs truncate">
                                              {item.drug.brandName}
                                            </h5>
                                            <p className="text-[10px] truncate font-medium opacity-80">
                                              {item.drug.genericName}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-current/20 relative z-10">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-medium opacity-75">
                                              {item.batch.batchNumber}
                                            </span>
                                            <Badge
                                              variant="secondary"
                                              className="text-[10px] h-5 px-2 font-semibold shadow-sm bg-white/40 border-current/30"
                                            >
                                              {item.quantity}
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 bg-white shadow-sm hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedRackItem(item);
                                              setRemoveQuantity(item.quantity.toString());
                                              setShowMoveDialog(true);
                                            }}
                                          >
                                            <ArrowLeftRight className="h-3 w-3 text-blue-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 bg-white shadow-sm hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedRackItem(item);
                                              setRemoveQuantity(item.quantity.toString());
                                              setShowRemoveDialog(true);
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3 text-red-600" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Enhanced shadow under box */}
                                      <div className="h-2 bg-black/10 rounded-full blur-md mt-1 mx-3"></div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-24">
                                  <div
                                    className={`text-center p-4 rounded-lg ${isBeingDraggedOver ? 'bg-blue-100/50 border-2 border-dashed border-blue-400' : 'bg-gray-100/50'}`}
                                  >
                                    <p className="text-sm font-bold text-gray-600">
                                      {isBeingDraggedOver ? '📦 Drop here!' : '✨ Empty rack'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Rack bottom border - sleek metal effect */}
                            <div className="h-3 bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 border-t border-slate-400/30 shadow-inner relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                            </div>

                            {/* Progress bar at bottom */}
                            <div className="px-4 pb-2.5 bg-white/30">
                              <Progress value={percentage} className="h-2 bg-white/50" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {selectedShelf.shelves.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400 mb-3">No racks in this shelf</p>
                      <Button size="sm" onClick={() => setShowRackDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Rack
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 mb-3">No shelves created yet</p>
                <Button onClick={() => setShowShelfDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Shelf
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Shelf Dialog */}
      <Dialog open={showShelfDialog} onOpenChange={setShowShelfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Shelf</DialogTitle>
            <DialogDescription>Add a new shelf to organize your inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Shelf Name</Label>
              <Input
                placeholder="e.g., Shelf A, Refrigerated Storage"
                value={shelfName}
                onChange={(e) => setShelfName(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                placeholder="e.g., For temperature-sensitive items"
                value={shelfDescription}
                onChange={(e) => setShelfDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShelfDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createShelf}>Create Shelf</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rack Dialog */}
      <Dialog open={showRackDialog} onOpenChange={setShowRackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Rack</DialogTitle>
            <DialogDescription>Add a new rack to {selectedShelf?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rack Name</Label>
              <Input
                placeholder="e.g., Rack 1, Top Rack"
                value={rackName}
                onChange={(e) => setRackName(e.target.value)}
              />
            </div>
            <div>
              <Label>Capacity (units)</Label>
              <Input
                type="number"
                placeholder="500"
                value={rackCapacity}
                onChange={(e) => setRackCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createRack}>Create Rack</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shelf Confirmation */}
      <Dialog open={showDeleteShelfDialog} onOpenChange={setShowDeleteShelfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shelf?</DialogTitle>
            <DialogDescription>
              This will delete the shelf and all its racks. Items will be returned to unassigned
              inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteShelfDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteShelf}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rack Confirmation */}
      <Dialog open={showDeleteRackDialog} onOpenChange={setShowDeleteRackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rack?</DialogTitle>
            <DialogDescription>
              This will delete the rack. Items will be returned to unassigned inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteRackDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRack}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Rack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Items Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Items from Rack</DialogTitle>
            <DialogDescription>
              Remove items and return them to unassigned inventory
            </DialogDescription>
          </DialogHeader>
          {selectedRackItem && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">{selectedRackItem.drug.brandName}</p>
                <p className="text-xs text-gray-500">{selectedRackItem.drug.genericName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Batch: {selectedRackItem.batch.batchNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Available on rack: {selectedRackItem.quantity} units
                </p>
              </div>
              <div>
                <Label>Quantity to Remove</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={removeQuantity}
                  onChange={(e) => setRemoveQuantity(e.target.value)}
                  max={selectedRackItem.quantity}
                  min={1}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveItems}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Items Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items to Another Rack</DialogTitle>
            <DialogDescription>Move items from one rack to another</DialogDescription>
          </DialogHeader>
          {selectedRackItem && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">{selectedRackItem.drug.brandName}</p>
                <p className="text-xs text-gray-500">{selectedRackItem.drug.genericName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Batch: {selectedRackItem.batch.batchNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Available: {selectedRackItem.quantity} units
                </p>
              </div>
              <div>
                <Label>Quantity to Move</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={removeQuantity}
                  onChange={(e) => setRemoveQuantity(e.target.value)}
                  max={selectedRackItem.quantity}
                  min={1}
                />
              </div>
              <div>
                <Label>Target Rack</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={targetRackId}
                  onChange={(e) => setTargetRackId(e.target.value)}
                >
                  <option value="">Select target rack</option>
                  {shelves.flatMap((shelf) =>
                    shelf.shelves
                      .filter((rack) => rack.id !== selectedRackItem.shelfId)
                      .map((rack) => (
                        <option key={rack.id} value={rack.id}>
                          {shelf.name} → {rack.name} ({rack.currentOccupancy}/{rack.capacity} units)
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveItems}>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Move Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
