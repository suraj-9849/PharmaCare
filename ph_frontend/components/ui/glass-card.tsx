import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'slate' | 'none';
  hoverable?: boolean;
  onClick?: () => void;
  delay?: number;
}

const gradientMap = {
  emerald: 'bg-gradient-to-br from-emerald-50/80 via-emerald-50/50 to-white/80',
  rose: 'bg-gradient-to-br from-rose-50/80 via-rose-50/50 to-white/80',
  amber: 'bg-gradient-to-br from-amber-50/80 via-amber-50/50 to-white/80',
  blue: 'bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-white/80',
  purple: 'bg-gradient-to-br from-purple-50/80 via-purple-50/50 to-white/80',
  slate: 'bg-gradient-to-br from-slate-50/80 via-slate-50/50 to-white/80',
  none: 'bg-white/60',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  gradient = 'none',
  hoverable = false,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverable ? { scale: 1.02, y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl backdrop-blur-xl border border-white/40 shadow-xl',
        'transition-all duration-300',
        gradientMap[gradient],
        hoverable && 'cursor-pointer hover:shadow-2xl hover:border-white/60',
        className
      )}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      }}
    >
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />

      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-50" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Border glow on hover */}
      {hoverable && (
        <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-blue-400/30" />
      )}
    </motion.div>
  );
};
