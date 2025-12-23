'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Eye, Plus, Minus } from 'lucide-react';

interface ShelfLocation {
  id: string;
  shelfCode: string;
  shelfName: string | null;
  row: string | null;
  column: string | null;
  zone: string | null;
  slotPosition: number | null;
}

interface InventoryBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  sellPrice: number;
  slotPosition: number | null;
  shelfLocation: ShelfLocation | null;
}

interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string | null;
}

interface AvailabilityResult {
  prescribedMedication: Medication;
  matchResult: {
    matchedDrugId: string | null;
    matchedDrugName: string;
    confidence: number;
    requiresPrescription: boolean;
    availableQuantity: number;
    isAvailable: boolean;
    alternativeSuggestions: string[];
  };
  availableBatches: InventoryBatch[];
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface BatchSelectionCardProps {
  result: AvailabilityResult;
  selectedBatches: Array<{ batchId: string; quantity: number }>;
  onBatchesChange: (batches: Array<{ batchId: string; quantity: number }>) => void;
  onViewShelfLocation: (location: ShelfLocation, slotPosition: number | null) => void;
}

export function BatchSelectionCard({
  result,
  selectedBatches,
  onBatchesChange,
  onViewShelfLocation,
}: BatchSelectionCardProps) {
  const medName = result.prescribedMedication.medicationName;
  const requiredQty = result.prescribedMedication.quantity;
  const batches = result.availableBatches;

  const getTotalSelected = () => {
    return selectedBatches.reduce((sum, sel) => sum + sel.quantity, 0);
  };

  const canSelectBatch = (batchIndex: number): boolean => {
    if (batchIndex === 0) return true; // First batch always selectable

    // Check if all previous batches are fully allocated
    for (let i = 0; i < batchIndex; i++) {
      const prevBatch = batches[i];
      const selectedFromPrev =
        selectedBatches.find((s) => s.batchId === prevBatch.id)?.quantity || 0;
      if (selectedFromPrev < prevBatch.quantity) {
        return false; // Previous batch not fully used
      }
    }
    return true;
  };

  const updateBatchQuantity = (batchId: string, quantity: number) => {
    const newSelections = [...selectedBatches];
    const existing = newSelections.find((s) => s.batchId === batchId);

    if (existing) {
      if (quantity > 0) {
        existing.quantity = quantity;
      } else {
        newSelections.splice(newSelections.indexOf(existing), 1);
      }
    } else if (quantity > 0) {
      newSelections.push({ batchId, quantity });
    }

    onBatchesChange(newSelections);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="p-4 mb-4">
      {/* Medication Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-lg">{medName}</h4>
          <p className="text-sm text-muted-foreground">
            {result.prescribedMedication.dosage} • {result.prescribedMedication.frequency}
          </p>
        </div>
        <Badge className={getTotalSelected() >= requiredQty ? 'bg-green-500' : 'bg-orange-500'}>
          Need: {requiredQty} | Selected: {getTotalSelected()}
        </Badge>
      </div>

      {/* Batches */}
      <div className="space-y-3">
        {batches.map((batch, index) => {
          const isFirstBatch = index === 0;
          const canSelect = canSelectBatch(index);
          const selectedQty = selectedBatches.find((s) => s.batchId === batch.id)?.quantity || 0;
          const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
          const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
          const isExpired = daysUntilExpiry <= 0;

          return (
            <div
              key={batch.id}
              className={`border rounded-lg p-3 ${
                isFirstBatch
                  ? 'border-green-500 border-2 bg-green-50'
                  : canSelect
                    ? 'border-gray-300'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Badge Row */}
              <div className="flex items-center gap-2 mb-2">
                {isFirstBatch && <Badge className="bg-green-600">SELL FIRST</Badge>}
                {!isFirstBatch && !canSelect && <Badge variant="secondary">FEFO LOCKED</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  Batch: {batch.batchNumber}
                </span>
              </div>

              {/* Batch Details */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span
                    className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''}
                  >
                    Exp:{' '}
                    {new Date(batch.expiryDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  Stock: <strong>{batch.quantity}</strong> units
                </div>
              </div>

              {/* Shelf Location */}
              {batch.shelfLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-2 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => onViewShelfLocation(batch.shelfLocation!, batch.slotPosition)}
                >
                  <MapPin className="w-3 h-3" />
                  Location: {batch.shelfLocation.shelfCode}
                  <Eye className="w-3 h-3 ml-auto" />
                </Button>
              )}

              {/* Price and Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-600">₹{batch.sellPrice}/unit</span>

                {canSelect && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBatchQuantity(batch.id, Math.max(0, selectedQty - 1))}
                      disabled={selectedQty === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{selectedQty}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateBatchQuantity(batch.id, Math.min(batch.quantity, selectedQty + 1))
                      }
                      disabled={selectedQty >= batch.quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
