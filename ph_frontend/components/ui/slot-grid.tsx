import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SlotData {
  id: number;
  occupied: boolean;
  expired?: boolean;
  batch?: {
    id: string;
    name: string;
    quantity: number;
    expiryDate: string;
    temperature?: string;
  };
}

interface SlotGridProps {
  rows: number;
  columns: number;
  utilizationPercentage: number;
  slots?: SlotData[];
  compact?: boolean;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  rows,
  columns,
  utilizationPercentage,
  slots = [],
  compact = false,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const totalSlots = rows * columns;
  const filledCount = Math.round((utilizationPercentage / 100) * totalSlots);

  // Generate slot data
  const gridSlots: SlotData[] = Array.from({ length: totalSlots }, (_, i) => {
    const existingSlot = slots[i];
    if (existingSlot) return existingSlot;

    return {
      id: i,
      occupied: i < filledCount,
      expired: false,
    };
  });

  const slotSize = compact ? 'h-3 w-3' : 'h-6 w-6';

  return (
    <div className="relative">
      {/* LED Grid */}
      <div
        className={cn(
          'grid gap-1 p-3 rounded-md relative',
          'bg-gradient-to-b from-slate-950 to-black',
          'border border-slate-800/50',
          'shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]'
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {/* Grid Background Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${100 / columns}% ${100 / rows}%`,
            }}
          />
        </div>

        {gridSlots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.005, duration: 0.2 }}
            onMouseEnter={() => setHoveredSlot(index)}
            onMouseLeave={() => setHoveredSlot(null)}
            className={cn(
              slotSize,
              'relative rounded-sm transition-all duration-200',
              'border border-slate-900',
              slot.occupied
                ? slot.expired
                  ? 'bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  : 'bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                : 'bg-slate-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]',
              hoveredSlot === index && slot.occupied && 'scale-110 brightness-125 z-10'
            )}
          >
            {/* LED Glow Effect */}
            {slot.occupied && (
              <>
                <div
                  className={cn(
                    'absolute inset-0 rounded-sm blur-sm',
                    slot.expired ? 'bg-red-400/40' : 'bg-cyan-300/40'
                  )}
                />
                {/* Pulsing for expired */}
                {slot.expired && (
                  <motion.div
                    className="absolute inset-0 rounded-sm bg-red-400/30"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </>
            )}

            {/* Inner highlight (LED reflection) */}
            {slot.occupied && (
              <div
                className={cn(
                  'absolute top-0 left-0 right-1/2 bottom-1/2 rounded-tl-sm',
                  'bg-gradient-to-br from-white/40 to-transparent'
                )}
              />
            )}

            {/* Tooltip */}
            {hoveredSlot === index && slot.occupied && slot.batch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'absolute z-50 pointer-events-none',
                  compact ? 'bottom-full mb-1' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                )}
              >
                <div
                  className={cn(
                    'bg-slate-950/95 backdrop-blur-sm border border-cyan-500/30',
                    'px-2 py-1.5 rounded text-[10px] font-mono whitespace-nowrap',
                    'shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  )}
                >
                  <div className="text-cyan-400 font-bold">#{slot.batch.id}</div>
                  <div className="text-slate-300">{slot.batch.name}</div>
                  <div className="text-slate-400">Qty: {slot.batch.quantity}</div>
                  <div className="text-slate-400">Exp: {slot.batch.expiryDate}</div>
                  {slot.batch.temperature && (
                    <div className="text-blue-400">Temp: {slot.batch.temperature}</div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Status Readout */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
          OCCUPIED: {filledCount}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
          EMPTY: {totalSlots - filledCount}
        </span>
      </div>
    </div>
  );
};
