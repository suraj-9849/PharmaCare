import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatData {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  suffix?: string;
  color?: 'emerald' | 'orange' | 'red' | 'slate';
}

interface MinimalStatsBarProps {
  stats: StatData[];
  className?: string;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className="w-16 h-8"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MinimalStatsBar: React.FC<MinimalStatsBarProps> = ({
  stats,
  className,
}) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          text: 'text-emerald-600',
          stroke: '#10b981',
        };
      case 'orange':
        return {
          text: 'text-orange-600',
          stroke: '#f97316',
        };
      case 'red':
        return {
          text: 'text-red-600',
          stroke: '#ef4444',
        };
      default:
        return {
          text: 'text-slate-900',
          stroke: '#0f172a',
        };
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-12 py-6',
        className
      )}
    >
      {stats.map((stat, index) => {
        const colorClass = getColorClass(stat.color || 'slate');

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            {/* Value */}
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">
                {stat.label}
              </span>
              <div className="flex items-baseline gap-1">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                  className={cn(
                    'text-4xl font-bold tabular-nums',
                    colorClass.text
                  )}
                >
                  {stat.value}
                </motion.span>
                {stat.suffix && (
                  <span className={cn('text-xl font-semibold', colorClass.text)}>
                    {stat.suffix}
                  </span>
                )}
              </div>
            </div>

            {/* Sparkline */}
            {stat.sparklineData && stat.sparklineData.length > 1 && (
              <div className="opacity-40 hover:opacity-100 transition-opacity">
                <Sparkline data={stat.sparklineData} color={colorClass.stroke} />
              </div>
            )}

            {/* Divider */}
            {index < stats.length - 1 && (
              <div className="w-px h-12 bg-slate-200" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
