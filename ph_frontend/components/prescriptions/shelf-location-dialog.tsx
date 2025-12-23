'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MapPin, Pill } from 'lucide-react';

interface ShelfLocation {
  id: string;
  shelfCode: string;
  shelfName: string | null;
  row: string | null;
  column: string | null;
  zone: string | null;
  slotPosition: number | null;
}

interface ShelfLocationDialogProps {
  location: ShelfLocation | null;
  slotPosition: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShelfLocationDialog({
  location,
  slotPosition,
  open,
  onOpenChange,
}: ShelfLocationDialogProps) {
  if (!location) return null;

  const rows = parseInt(location.row || '3');
  const cols = parseInt(location.column || '5');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shelf Location
          </DialogTitle>
          <DialogDescription>{location.shelfName || location.shelfCode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shelf Grid */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="grid gap-2">
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-2">
                  <div className="w-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded flex items-center justify-center text-xs font-bold">
                    Row {rowIdx + 1}
                  </div>
                  {Array.from({ length: cols }).map((_, colIdx) => {
                    const slotNum = rowIdx * cols + colIdx + 1;
                    const isHighlighted = slotNum === slotPosition;

                    return (
                      <div
                        key={colIdx}
                        className={`flex-1 h-16 rounded flex flex-col items-center justify-center text-xs font-medium ${
                          isHighlighted
                            ? 'bg-blue-500 text-white border-2 border-blue-700 shadow-lg scale-110'
                            : 'bg-white border border-gray-300'
                        }`}
                      >
                        {isHighlighted && <Pill className="w-4 h-4 mb-1" />}
                        <span>#{slotNum}</span>
                        {isHighlighted && <span className="text-[10px] font-bold">HERE</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-muted-foreground">Shelf Code:</span>
              <strong>{location.shelfCode}</strong>
            </div>
            {location.zone && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-muted-foreground">Zone:</span>
                <strong>{location.zone}</strong>
              </div>
            )}
            {slotPosition && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-muted-foreground">Slot Position:</span>
                <strong>#{slotPosition}</strong>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
