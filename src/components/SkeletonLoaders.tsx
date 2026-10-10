import React from 'react';

/**
 * Generic Shimmer Box helper
 */
export const ShimmerBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-xl ${className}`} />
);

/**
 * Results View Skeleton - Hall of Fame Winners
 */
export const ResultsWinnersSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300" aria-label="Loading champions data">
      {/* Top Banner Skeleton */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-emerald-800">
        <div className="space-y-3 w-full max-w-xl">
          <div className="skeleton-shimmer-dark h-4 w-44 rounded-md" />
          <div className="skeleton-shimmer-dark h-8 w-72 rounded-lg" />
          <div className="skeleton-shimmer-dark h-4 w-full max-w-md rounded-md" />
        </div>
        <div className="skeleton-shimmer-dark h-11 w-52 rounded-xl shrink-0" />
      </div>

      {/* Hall of Fame Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            {/* Header: Year + Event */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShimmerBox className="h-6 w-16 rounded" />
                <ShimmerBox className="h-4 w-40 rounded" />
              </div>
              <ShimmerBox className="h-6 w-6 rounded-full" />
            </div>

            {/* Body */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <ShimmerBox className="h-3 w-28 rounded" />
                <ShimmerBox className="h-6 w-64 rounded-md" />
                <ShimmerBox className="h-3.5 w-32 rounded" />
              </div>

              {/* MVP Pill */}
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                <ShimmerBox className="h-4 w-28 rounded" />
                <ShimmerBox className="h-4 w-36 rounded" />
              </div>

              {/* STEM Champion Pill */}
              <div className="bg-emerald-50/50 p-3 rounded-xl flex items-center justify-between border border-emerald-100/60">
                <ShimmerBox className="h-4 w-28 rounded" />
                <ShimmerBox className="h-4 w-40 rounded" />
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <ShimmerBox className="h-3 w-36 rounded" />
              <ShimmerBox className="h-8 w-44 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Results View Skeleton - Schools Leaderboard Table
 */
export const ResultsSchoolsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-label="Loading schools rankings">
      {/* Search and Filters Bar Skeleton */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <ShimmerBox className="h-10 w-full md:w-80 rounded-xl" />
        <div className="flex gap-2 w-full md:w-auto">
          <ShimmerBox className="h-10 w-36 rounded-xl" />
          <ShimmerBox className="h-10 w-40 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-6 gap-4">
          <ShimmerBox className="h-4 w-12 rounded" />
          <ShimmerBox className="h-4 w-36 col-span-2 rounded" />
          <ShimmerBox className="h-4 w-24 rounded" />
          <ShimmerBox className="h-4 w-20 rounded" />
          <ShimmerBox className="h-4 w-24 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="p-4 grid grid-cols-6 gap-4 items-center">
              <div className="flex items-center gap-2">
                <ShimmerBox className="h-6 w-6 rounded-md" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <ShimmerBox className="h-4 w-52 rounded" />
                <ShimmerBox className="h-3 w-32 rounded" />
              </div>
              <div className="space-y-1">
                <ShimmerBox className="h-4 w-24 rounded" />
                <ShimmerBox className="h-3 w-16 rounded" />
              </div>
              <div className="flex justify-center">
                <ShimmerBox className="h-5 w-12 rounded" />
              </div>
              <div className="flex justify-end">
                <ShimmerBox className="h-5 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Results View Skeleton - 15 Counties Matrix
 */
export const ResultsCountiesSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300" aria-label="Loading counties data">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <ShimmerBox className="h-3.5 w-32 mx-auto rounded" />
        <ShimmerBox className="h-7 w-64 mx-auto rounded-lg" />
        <ShimmerBox className="h-4 w-96 mx-auto rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((c) => (
          <div key={c} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <ShimmerBox className="h-5 w-32 rounded" />
                <ShimmerBox className="h-5 w-20 rounded" />
              </div>
              <ShimmerBox className="h-10 w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                <ShimmerBox className="h-14 rounded-lg" />
                <ShimmerBox className="h-14 rounded-lg" />
                <ShimmerBox className="h-14 rounded-lg" />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <ShimmerBox className="h-3.5 w-40 rounded" />
              <ShimmerBox className="h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Results View Skeleton - Championship Scorecards
 */
export const ResultsChampionshipsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300" aria-label="Loading tournament scorecards">
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <ShimmerBox className="h-6 w-72 rounded-md" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShimmerBox className="h-5 w-24 rounded" />
                  <ShimmerBox className="h-4 w-48 rounded" />
                </div>
                <ShimmerBox className="h-6 w-32 rounded" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ShimmerBox className="h-16 rounded-xl" />
                <ShimmerBox className="h-16 rounded-xl" />
              </div>
              <ShimmerBox className="h-10 w-full rounded-xl" />
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <ShimmerBox className="h-3.5 w-36 rounded" />
                <ShimmerBox className="h-7 w-48 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Gallery Grid Skeleton
 */
export const GalleryGridSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-label="Loading gallery media">
      {/* Tag filters placeholder */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((t) => (
          <ShimmerBox key={t} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4"
          >
            {/* Image Placeholder */}
            <div className="h-56 relative skeleton-shimmer">
              <div className="absolute top-3 left-3">
                <div className="bg-slate-300/80 h-5 w-16 rounded-full" />
              </div>
              <div className="absolute bottom-3 right-3">
                <div className="bg-slate-300/80 h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 pt-0 space-y-3">
              <div className="space-y-1.5">
                <ShimmerBox className="h-5 w-4/5 rounded" />
                <ShimmerBox className="h-3.5 w-full rounded" />
                <ShimmerBox className="h-3.5 w-3/4 rounded" />
              </div>

              {/* Metadata */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <ShimmerBox className="h-3.5 w-24 rounded" />
                <ShimmerBox className="h-3.5 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * News Articles Grid Skeleton
 */
export const NewsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300" aria-label="Loading news dispatches">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
        >
          <div>
            {/* Thumbnail */}
            <div className="h-52 skeleton-shimmer relative">
              <div className="absolute top-3 left-3">
                <div className="bg-slate-300/80 h-5 w-24 rounded-md" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <ShimmerBox className="h-3.5 w-24 rounded" />
                <ShimmerBox className="h-3.5 w-16 rounded" />
              </div>
              <ShimmerBox className="h-6 w-11/12 rounded" />
              <ShimmerBox className="h-4 w-full rounded" />
              <ShimmerBox className="h-4 w-5/6 rounded" />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between">
            <ShimmerBox className="h-3.5 w-28 rounded" />
            <ShimmerBox className="h-4 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Single News Article Reader View Skeleton
 */
export const NewsDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300" aria-label="Loading full article">
      <ShimmerBox className="h-9 w-40 rounded-xl" />
      
      <div className="space-y-4">
        <ShimmerBox className="h-6 w-32 rounded-full" />
        <ShimmerBox className="h-10 sm:h-12 w-full rounded-xl" />
        <ShimmerBox className="h-5 w-2/3 rounded-lg" />
        
        <div className="flex items-center gap-4 pt-2">
          <ShimmerBox className="h-4 w-32 rounded" />
          <ShimmerBox className="h-4 w-24 rounded" />
          <ShimmerBox className="h-4 w-28 rounded" />
        </div>
      </div>

      <ShimmerBox className="h-80 sm:h-96 w-full rounded-3xl" />

      <div className="space-y-4 pt-4">
        <ShimmerBox className="h-4 w-full rounded" />
        <ShimmerBox className="h-4 w-full rounded" />
        <ShimmerBox className="h-4 w-4/5 rounded" />
        <div className="py-2" />
        <ShimmerBox className="h-4 w-full rounded" />
        <ShimmerBox className="h-4 w-11/12 rounded" />
        <ShimmerBox className="h-4 w-3/4 rounded" />
      </div>
    </div>
  );
};
