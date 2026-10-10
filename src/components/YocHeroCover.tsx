import React, { useState } from 'react';
import { YOC_COVER_SRC } from '../data/assets';

interface YocHeroCoverProps {
  className?: string;
  overlayOpacity?: string;
}

export const YocHeroCover: React.FC<YocHeroCoverProps> = ({
  className = '',
  overlayOpacity = 'opacity-75 sm:opacity-85'
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`absolute inset-0 overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Dynamic SVG Patriotic Background Texture in case of slow image load */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.18) 0%, transparent 60%)`
        }}
      />

      {/* Primary YOC Cover Banner Image */}
      {!hasError && (
        <img
          src="/yoccover.png"
          alt="Youth For Change Liberia National Championship Cover"
          loading="eager"
          decoding="async"
          // @ts-ignore
          fetchPriority="high"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== YOC_COVER_SRC) {
              target.src = YOC_COVER_SRC;
            } else {
              setHasError(true);
            }
          }}
          className={`w-[130%] min-w-[130%] h-full object-cover object-center ${overlayOpacity} animate-slide-slow-left`}
        />
      )}

      {/* Decorative Grid Mesh & Patriotic Star Watermark */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
};
