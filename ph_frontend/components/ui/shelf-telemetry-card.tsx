import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface ShelfTelemetryCardProps {
  shelfCode: string;
  shelfName: string;
  rows: number;
  columns: number;
  utilizationPercentage: number;
  zone?: string;
  hasAlerts?: boolean;
  temperature?: string;
  onClick?: () => void;
  className?: string;
}

export const ShelfTelemetryCard: React.FC<ShelfTelemetryCardProps> = ({
  shelfCode,
  shelfName,
  rows,
  columns,
  utilizationPercentage,
  zone,
  hasAlerts,
  temperature,
  onClick,
  className,
}) => {
  const totalSlots = rows * columns;
  const filledSlots = Math.round((utilizationPercentage / 100) * totalSlots);

  // Generate mini grid
  const miniGrid = Array.from({ length: Math.min(25, totalSlots) }, (_, i) => {
    const isFilled = i < Math.round((filledSlots / totalSlots) * Math.min(25, totalSlots));
    return isFilled;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer',
        'bg-white/80 backdrop-blur-md',
        'border border-slate-200/60',
        'rounded-2xl overflow-hidden',
        'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        'hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)]',
        'transition-shadow duration-500',
        className
      )}
    >
      {/* Status Pulse Beacon */}
      {hasAlerts && (
        <div className="absolute top-3 right-3 z-20">
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-60" />
            <AlertCircle className="relative h-5 w-5 text-red-500" />
          </motion.div>
        </div>
      )}

      {/* Glass Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-slate-50/40 pointer-events-none" />

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          {/* Shelf Code - Monospace Tag */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'px-3 py-1.5 rounded-lg font-mono font-bold text-sm',
                'bg-slate-950 text-emerald-400',
                'border border-slate-800',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
              )}
            >
              [ {shelfCode} ]
            </div>
            {zone && zone !== 'General' && (
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {zone}
              </span>
            )}
          </div>

          {/* Shelf Name */}
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
            {shelfName}
          </h3>
        </div>

        {/* Mini Grid Preview */}
        <div className="relative">
          <div
            className="grid gap-1.5 p-4 rounded-xl bg-slate-50/50 border border-slate-200/40"
            style={{
              gridTemplateColumns: `repeat(5, minmax(0, 1fr))`,
            }}
          >
            {miniGrid.map((isFilled, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  isFilled
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-200 border border-slate-300'
                )}
              />
            ))}
          </div>

          {/* Utilization Label */}
          <div className="absolute -bottom-2 right-2 px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-700">
              {utilizationPercentage}%
            </span>
          </div>
        </div>

        {/* Temperature Badge (if refrigerated) */}
        {temperature && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/40">
            <div className="flex-1 flex items-center gap-2 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-medium">{temperature}</span>
            </div>
          </div>
        )}
      </div>

      {/* Inner Glow Ring on Hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.2)',
        }}
      />
    </motion.div>
  );
};
