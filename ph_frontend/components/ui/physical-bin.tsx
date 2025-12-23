import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Pill, Thermometer } from 'lucide-react';

interface BatchData {
  id: string;
  name: string;
  batchId: string;
  quantity: number;
  expiryDate: string;
  manufacturer?: string;
  temperature?: string;
  status: 'OK' | 'EXPIRING' | 'EXPIRED';
}

interface PhysicalBinProps {
  slotNumber: number;
  isEmpty: boolean;
  batch?: BatchData;
  className?: string;
}

export const PhysicalBin: React.FC<PhysicalBinProps> = ({
  slotNumber,
  isEmpty,
  batch,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: 'OK' | 'EXPIRING' | 'EXPIRED') => {
    switch (status) {
      case 'OK':
        return 'from-emerald-500/20 to-emerald-600/30';
      case 'EXPIRING':
        return 'from-orange-500/20 to-orange-600/30';
      case 'EXPIRED':
        return 'from-red-500/20 to-red-600/30';
    }
  };

  const getStatusGlow = (status: 'OK' | 'EXPIRING' | 'EXPIRED') => {
    switch (status) {
      case 'OK':
        return 'rgba(16, 185, 129, 0.3)';
      case 'EXPIRING':
        return 'rgba(249, 115, 22, 0.3)';
      case 'EXPIRED':
        return 'rgba(239, 68, 68, 0.3)';
    }
  };

  return (
    <motion.div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ zIndex: 50 }}
    >
      {/* MacBook Dock Style Zoom Effect */}
      <motion.div
        animate={{
          scale: isHovered ? 1.2 : 1,
          y: isHovered ? -8 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        className="relative"
      >
        {/* The Bin Container */}
        <div
          className={cn(
            'relative h-28 rounded-xl overflow-hidden',
            'transition-all duration-300',
            isEmpty
              ? 'border-2 border-dashed border-slate-300 bg-slate-50/50'
              : 'border border-slate-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
          )}
        >
          {isEmpty ? (
            /* Empty Bin */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-1">
                <div className="w-8 h-px bg-slate-300" />
                <span className="text-[10px] font-medium text-slate-400">Empty</span>
                <div className="w-8 h-px bg-slate-300" />
              </div>
            </div>
          ) : (
            batch && (
              <>
                {/* Colored Floor/Glow at Bottom */}
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-2',
                    'bg-gradient-to-t',
                    getStatusColor(batch.status)
                  )}
                  style={{
                    boxShadow: `0 -4px 12px ${getStatusGlow(batch.status)}`,
                  }}
                />

                {/* Medicine Content */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pill className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {batch.name}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">#{batch.batchId}</div>
                    </div>

                    {/* Status Indicator */}
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        batch.status === 'OK' && 'bg-emerald-500',
                        batch.status === 'EXPIRING' && 'bg-orange-500 animate-pulse',
                        batch.status === 'EXPIRED' && 'bg-red-500 animate-pulse'
                      )}
                    />
                  </div>

                  {/* Bottom Section - Batch Pill */}
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-bold',
                        batch.status === 'OK' && 'bg-emerald-50 text-emerald-700',
                        batch.status === 'EXPIRING' && 'bg-orange-50 text-orange-700',
                        batch.status === 'EXPIRED' && 'bg-red-50 text-red-700'
                      )}
                    >
                      Qty: {batch.quantity}
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>

        {/* Data Popover on Hover */}
        <AnimatePresence>
          {isHovered && !isEmpty && batch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-full ml-4 top-0 z-50 pointer-events-none whitespace-nowrap"
            >
              {/* Glass Popover */}
              <div
                className={cn(
                  'relative p-4 rounded-xl',
                  'bg-white/95 backdrop-blur-xl',
                  'border border-slate-200/60',
                  'shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
                )}
                style={{
                  minWidth: '280px',
                }}
              >
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 via-transparent to-slate-500/5 pointer-events-none" />

                {/* Content */}
                <div className="relative space-y-3">
                  {/* Header */}
                  <div className="pb-3 border-b border-slate-200/50">
                    <h4 className="font-bold text-slate-900 mb-1">{batch.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-600">
                        Batch: {batch.batchId}
                      </span>
                      <div
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          batch.status === 'OK' && 'bg-emerald-100 text-emerald-700',
                          batch.status === 'EXPIRING' && 'bg-orange-100 text-orange-700',
                          batch.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {batch.status}
                      </div>
                    </div>
                  </div>

                  {/* Data Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Quantity
                      </div>
                      <div className="text-sm font-bold text-slate-900">{batch.quantity} units</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Expiry Date
                      </div>
                      <div className="text-sm font-bold text-slate-900">{batch.expiryDate}</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(batch.manufacturer || batch.temperature) && (
                    <div className="pt-3 border-t border-slate-200/50 space-y-2">
                      {batch.manufacturer && (
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">Mfr:</span> {batch.manufacturer}
                        </div>
                      )}
                      {batch.temperature && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Thermometer className="h-3.5 w-3.5" />
                          <span className="font-medium">{batch.temperature}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Popover Arrow */}
                <div className="absolute right-full top-6 mr-px">
                  <div
                    className="w-3 h-3 rotate-45 bg-white/95 border-l border-b border-slate-200/60"
                    style={{
                      boxShadow: '-4px 4px 8px rgba(0,0,0,0.05)',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Slot Number Label */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        <span className="text-[9px] font-bold text-slate-600">{slotNumber}</span>
      </div>
    </motion.div>
  );
};
