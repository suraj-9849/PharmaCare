import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  rows: number;
  columns: number;
  utilizationPercentage: number;
  expiringCount?: number;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  rows,
  columns,
  utilizationPercentage,
  expiringCount = 0,
  className,
}) => {
  const totalSlots = rows * columns;
  const filledSlots = Math.round((utilizationPercentage / 100) * totalSlots);
  const expiringSlots = Math.min(expiringCount, filledSlots);

  // Generate slot data
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    if (i < filledSlots - expiringSlots) {
      return 'filled'; // Green - healthy stock
    } else if (i < filledSlots) {
      return 'expiring'; // Orange - expiring soon
    }
    return 'empty'; // Gray - empty
  });

  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <div
        className="grid gap-1 p-3 bg-gray-50 rounded-lg border border-gray-200"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {slots.map((status, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.01, duration: 0.2 }}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              status === 'filled' && 'bg-emerald-500 shadow-sm',
              status === 'expiring' && 'bg-orange-400 shadow-sm',
              status === 'empty' && 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
};
