import React from 'react';
import { motion } from 'motion/react';

export interface AnimatedCheckmarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: 'emerald' | 'yellow' | 'white' | 'primary';
  showHalo?: boolean;
  className?: string;
  strokeWidth?: number;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  size = 'md',
  color = 'emerald',
  showHalo = true,
  className = '',
  strokeWidth
}) => {
  // Dimensions map
  const sizeValue = typeof size === 'number' ? size : {
    xs: 18,
    sm: 24,
    md: 40,
    lg: 56,
    xl: 72
  }[size] || 40;

  const defaultStrokeWidth = strokeWidth || (sizeValue <= 24 ? 2.5 : 3.2);

  // Color mappings
  const colorMap = {
    emerald: {
      circleBg: 'bg-emerald-600',
      circleBorder: 'border-emerald-500',
      haloBg: 'bg-emerald-400/30',
      stroke: '#ffffff',
      shadow: 'shadow-emerald-900/20'
    },
    yellow: {
      circleBg: 'bg-yellow-400',
      circleBorder: 'border-yellow-300',
      haloBg: 'bg-yellow-300/40',
      stroke: '#064e3b', // deep emerald-950 for contrast on yellow
      shadow: 'shadow-yellow-950/20'
    },
    white: {
      circleBg: 'bg-white',
      circleBorder: 'border-slate-100',
      haloBg: 'bg-white/40',
      stroke: '#059669', // emerald-600 checkmark on white circle
      shadow: 'shadow-slate-900/10'
    },
    primary: {
      circleBg: 'bg-emerald-700',
      circleBorder: 'border-emerald-600',
      haloBg: 'bg-emerald-500/30',
      stroke: '#ffffff',
      shadow: 'shadow-emerald-950/30'
    }
  }[color];

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: sizeValue, height: sizeValue }}
      role="img"
      aria-label="Success"
    >
      {/* Subtle expanding pulse halo */}
      {showHalo && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut', repeat: 1, repeatDelay: 1.2 }}
          className={`absolute inset-0 rounded-full ${colorMap.haloBg} pointer-events-none`}
        />
      )}

      {/* Main circular base with bounce */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 24,
          duration: 0.4
        }}
        className={`w-full h-full rounded-full flex items-center justify-center ${colorMap.circleBg} ${colorMap.shadow} shadow-md`}
      >
        {/* Animated Checkmark SVG */}
        <svg
          viewBox="0 0 24 24"
          className="w-3/5 h-3/5 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M4.5 12.75l5 5 10-10.5"
            fill="none"
            stroke={colorMap.stroke}
            strokeWidth={defaultStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.38,
              ease: [0.65, 0, 0.35, 1],
              delay: 0.12
            }}
          />
        </svg>
      </motion.div>
    </div>
  );
};
