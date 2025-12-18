import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShelfVisualizerProps {
  rows: number;
  columns: number;
  currentStock: number;
  capacity: number;
  utilizationPercentage: number;
  className?: string;
}

export const ShelfVisualizer: React.FC<ShelfVisualizerProps> = ({
  rows,
  columns,
  currentStock,
  capacity,
  utilizationPercentage,
  className,
}) => {
  const totalSlots = rows * columns;
  const filledSlots = Math.round((utilizationPercentage / 100) * totalSlots);

  // Create array of slots
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    id: i,
    filled: i < filledSlots,
  }));

  return (
    <div className={cn('space-y-3', className)}>
      {/* Grid visualization */}
      <div
        className="grid gap-1.5 p-4 rounded-lg bg-slate-900/5 backdrop-blur-sm border border-slate-200/50"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {slots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.01,
              duration: 0.3,
              type: 'spring',
              stiffness: 200,
            }}
            className={cn(
              'aspect-square rounded-sm transition-all duration-300 relative group',
              slot.filled
                ? utilizationPercentage > 90
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-sm shadow-red-500/50'
                  : utilizationPercentage > 70
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm shadow-amber-500/50'
                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/50'
                : 'bg-slate-200/70 border border-slate-300/50'
            )}
          >
            {/* Glow effect for filled slots */}
            {slot.filled && (
              <div
                className={cn(
                  'absolute inset-0 rounded-sm blur-sm opacity-40',
                  utilizationPercentage > 90
                    ? 'bg-red-400'
                    : utilizationPercentage > 70
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                )}
              />
            )}

            {/* Pulse animation for critical */}
            {slot.filled && utilizationPercentage > 90 && (
              <motion.div
                className="absolute inset-0 rounded-sm bg-red-300"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-600 px-1">
        <span>
          {filledSlots} / {totalSlots} slots
        </span>
        <span className="text-slate-500">
          {rows}R × {columns}C
        </span>
      </div>
    </div>
  );
};
