import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MedicineData {
  id: string;
  name: string;
  batchId: string;
  quantity: number;
  expiryDate: string;
  manufacturer?: string;
  status: 'OK' | 'EXPIRING' | 'EXPIRED';
}

interface SlotData {
  id: number;
  occupied: boolean;
  medicine?: MedicineData;
}

interface RealisticShelfGridProps {
  rows: number;
  columns: number;
  slots?: SlotData[];
  className?: string;
}

export const RealisticShelfGrid: React.FC<RealisticShelfGridProps> = ({
  rows,
  columns,
  slots = [],
  className,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const totalSlots = rows * columns;

  // Generate slot data
  const gridSlots: SlotData[] = Array.from({ length: totalSlots }, (_, i) => {
    const existingSlot = slots[i];
    if (existingSlot) return existingSlot;

    return {
      id: i,
      occupied: false,
    };
  });

  const getStatusColor = (status: 'OK' | 'EXPIRING' | 'EXPIRED') => {
    switch (status) {
      case 'OK':
        return 'bg-emerald-500';
      case 'EXPIRING':
        return 'bg-orange-500';
      case 'EXPIRED':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Metallic Rack Frame */}
      <div className="bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 p-6 rounded-lg border border-slate-300 shadow-lg">
        {/* Grid of Slots */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {gridSlots.map((slot, index) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              onMouseEnter={() => setHoveredSlot(index)}
              onMouseLeave={() => setHoveredSlot(null)}
              className="relative"
            >
              {/* Plastic Bin Slot */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'relative bg-white rounded-md overflow-hidden',
                  'transition-all duration-200',
                  slot.occupied
                    ? 'border-2 border-gray-300 shadow-md'
                    : 'border-2 border-dashed border-gray-300 shadow-sm',
                  'h-24 w-full'
                )}
              >
                {/* Status Strip on Left */}
                {slot.occupied && slot.medicine && (
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-1.5',
                      getStatusColor(slot.medicine.status)
                    )}
                  />
                )}

                {/* Empty Slot State */}
                {!slot.occupied && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-300 text-xs font-medium">Empty</div>
                  </div>
                )}

                {/* Occupied Slot - Medicine Card */}
                {slot.occupied && slot.medicine && (
                  <div className="p-2 pl-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {slot.medicine.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        #{slot.medicine.batchId}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-gray-600">
                        Qty: {slot.medicine.quantity}
                      </div>
                      <div
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded',
                          slot.medicine.status === 'OK' && 'bg-emerald-50 text-emerald-700',
                          slot.medicine.status === 'EXPIRING' && 'bg-orange-50 text-orange-700',
                          slot.medicine.status === 'EXPIRED' && 'bg-red-50 text-red-700'
                        )}
                      >
                        {slot.medicine.status}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Tooltip */}
                <AnimatePresence>
                  {hoveredSlot === index && slot.occupied && slot.medicine && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-50 pointer-events-none bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    >
                      <div className="bg-gray-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700">
                        <div className="text-xs font-bold mb-1">
                          {slot.medicine.name}
                        </div>
                        <div className="text-[10px] text-gray-300 space-y-0.5">
                          <div>Batch: {slot.medicine.batchId}</div>
                          <div>Expiry: {slot.medicine.expiryDate}</div>
                          {slot.medicine.manufacturer && (
                            <div>Mfr: {slot.medicine.manufacturer}</div>
                          )}
                        </div>
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-gray-900/95" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
