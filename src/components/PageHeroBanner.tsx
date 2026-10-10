import React from 'react';

interface PageHeroBannerProps {
  category: string;
  title: string | React.ReactNode;
  subtitle: string;
  bgImage?: string;
  badge?: string;
  children?: React.ReactNode;
  stats?: { label: string; value: string }[];
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  category,
  title,
  subtitle,
  bgImage = '/group.jpg',
  badge,
  children,
  stats
}) => {
  return (
    <section className="relative bg-[#04261c] text-white overflow-hidden border-b border-emerald-900/60">
      {/* Background Photo with subtle translucent overlay so cover shows clearly */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50 scale-100 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Reduced green overlay allowing background cover to show */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#063d2e]/85 via-[#063d2e]/60 to-[#063d2e]/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#04261c] via-transparent to-black/25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 relative z-10 space-y-5">
        {/* Category & Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{badge}</span>
            </div>
          )}
          {category && (
            <div className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
              {category}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="font-condensed font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight text-white leading-[0.95]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed font-normal">
          {subtitle}
        </p>

        {/* Optional Action Buttons */}
        {children && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {children}
          </div>
        )}

        {/* Optional Stats Bar */}
        {stats && stats.length > 0 && (
          <div className="pt-8 mt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((st, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  {st.label}
                </div>
                <div className="font-condensed font-black text-3xl sm:text-4xl text-white">
                  {st.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
