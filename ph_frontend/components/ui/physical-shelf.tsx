import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PhysicalShelfProps {
  children: React.ReactNode;
  shelfCode: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  zone?: string;
  utilizationPercentage?: number;
  className?: string;
  onClick?: () => void;
}

export const PhysicalShelf: React.FC<PhysicalShelfProps> = ({
  children,
  shelfCode,
  status = 'ACTIVE',
  zone,
  utilizationPercentage = 0,
  className,
  onClick,
}) => {
  const util = Math.round(utilizationPercentage);

  // Determine status color
  const getStatusColor = () => {
    if (status !== 'ACTIVE') return 'text-slate-600';
    if (util > 90) return 'text-red-400';
    if (util > 70) return 'text-amber-400';
    return 'text-cyan-400';
  };

  const getGlowColor = () => {
    if (status !== 'ACTIVE') return 'rgba(71, 85, 105, 0.3)';
    if (util > 90) return 'rgba(248, 113, 113, 0.4)';
    if (util > 70) return 'rgba(251, 191, 36, 0.4)';
    return 'rgba(34, 211, 238, 0.4)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: -2, rotateX: 2 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer',
        'perspective-1000',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Metallic Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg',
          'bg-gradient-to-b from-slate-900 via-slate-950 to-black',
          'border border-slate-800/50',
          'shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(148,163,184,0.1)]',
          'transition-all duration-300',
          'group-hover:border-slate-700/70'
        )}
        style={{
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(148, 163, 184, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(15, 23, 42, 0.5)
          `,
        }}
      >
        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Top Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

        {/* Header Plate */}
        <div className="relative p-4 pb-3">
          <div className="flex items-center justify-between">
            {/* Shelf Code - LCD Style */}
            <div className="relative">
              <div
                className={cn(
                  'px-3 py-1.5 rounded font-mono font-bold text-lg',
                  'bg-black/80 border border-slate-800',
                  'shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]',
                  getStatusColor()
                )}
                style={{
                  textShadow: `0 0 10px ${getGlowColor()}, 0 0 20px ${getGlowColor()}`,
                }}
              >
                {shelfCode}
              </div>

              {/* Status LED */}
              {status === 'ACTIVE' && (
                <motion.div
                  className={cn(
                    'absolute -top-1 -right-1 w-2 h-2 rounded-full',
                    util > 90
                      ? 'bg-red-400'
                      : util > 70
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                  )}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      `0 0 4px ${getGlowColor()}`,
                      `0 0 8px ${getGlowColor()}`,
                      `0 0 4px ${getGlowColor()}`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Zone Badge */}
            {zone && zone !== 'General' && (
              <div
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                  'bg-slate-950/80 border border-slate-700/50',
                  'text-slate-400'
                )}
              >
                {zone}
              </div>
            )}
          </div>

          {/* Utilization Bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${util}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn(
                  'h-full relative',
                  util > 90
                    ? 'bg-red-500'
                    : util > 70
                      ? 'bg-amber-500'
                      : 'bg-cyan-500'
                )}
                style={{
                  boxShadow: `0 0 8px ${getGlowColor()}`,
                }}
              >
                {/* Moving scan line */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 min-w-[3ch] text-right">
              {util}%
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 pb-4">{children}</div>

        {/* Bottom Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black to-transparent" />
      </div>

      {/* Outer Glow on Hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          '-z-10 blur-xl'
        )}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};
