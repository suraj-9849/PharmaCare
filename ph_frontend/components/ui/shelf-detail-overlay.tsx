import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Thermometer } from 'lucide-react';
import { PhysicalBin } from './physical-bin';

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

interface SlotData {
  slotNumber: number;
  isEmpty: boolean;
  batch?: BatchData;
}

interface ShelfDetailOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  shelfCode: string;
  shelfName: string;
  rows: number;
  columns: number;
  zone?: string;
  temperature?: string;
  utilizationPercentage: number;
  slots: SlotData[];
}

export const ShelfDetailOverlay: React.FC<ShelfDetailOverlayProps> = ({
  isOpen,
  onClose,
  shelfCode,
  shelfName,
  rows,
  columns,
  zone,
  temperature,
  utilizationPercentage,
  slots,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Heavy Glass Blur Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Floating Overlay Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-[7.5%] z-50 overflow-hidden"
          >
            {/* Glass Container */}
            <div
              className={cn(
                'relative h-full w-full rounded-3xl overflow-hidden',
                'bg-white/90 backdrop-blur-2xl',
                'border border-slate-200/60',
                'shadow-[0_32px_128px_rgba(0,0,0,0.12)]'
              )}
            >
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-slate-50/40 pointer-events-none" />

              {/* Content */}
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 px-8 py-6 border-b border-slate-200/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      {/* Monospace Shelf Tag */}
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'px-4 py-2 rounded-xl font-mono font-bold text-lg',
                            'bg-slate-950 text-emerald-400',
                            'border border-slate-800',
                            'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                          )}
                        >
                          [ {shelfCode} ]
                        </div>
                        {zone && zone !== 'General' && (
                          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            {zone}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold text-slate-900">{shelfName}</h2>

                      {/* Meta Info */}
                      <div className="flex items-center gap-6 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Grid:</span> {rows} × {columns}
                        </div>
                        <div>
                          <span className="font-medium">Utilization:</span>{' '}
                          <span className="font-bold text-emerald-600">{utilizationPercentage}%</span>
                        </div>
                        {temperature && (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Thermometer className="h-4 w-4" />
                            <span className="font-medium">{temperature}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className={cn(
                        'p-2 rounded-xl',
                        'bg-slate-100 hover:bg-slate-200',
                        'text-slate-600 hover:text-slate-900',
                        'transition-colors'
                      )}
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>

                {/* Rack Visualization Area */}
                <div className="flex-1 overflow-auto p-8">
                  <div className="max-w-7xl mx-auto">
                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
                      Digital Twin — Physical Rack Layout
                    </h3>

                    {/* The Physical Bin Grid */}
                    <div
                      className="grid gap-4 p-6 rounded-2xl bg-slate-50/50 border border-slate-200/40"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      }}
                    >
                      {slots.map((slot) => (
                        <PhysicalBin
                          key={slot.slotNumber}
                          slotNumber={slot.slotNumber}
                          isEmpty={slot.isEmpty}
                          batch={slot.batch}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center gap-6 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Healthy Stock</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                        <span>Expiring Soon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span>Expired</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-slate-500">Hover over bins for details</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
