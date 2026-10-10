import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackText?: string;
  fallbackCategory?: string;
  fallbackTitle?: string;
  containerClassName?: string;
  priority?: boolean;
}

/**
 * Maps categories or text hints to real permanent high-resolution archive photography
 * so cards never appear blank or missing when ephemeral uploads expire.
 */
export function getContextualArchiveFallback(category?: string, hint = ''): string {
  const lower = (String(category || '') + ' ' + String(hint || '')).toLowerCase();
  if (lower.includes('stem') || lower.includes('science') || lower.includes('tech') || lower.includes('robot')) {
    return '/STEM.jpeg';
  }
  if (lower.includes('debate') || lower.includes('trophy') || lower.includes('champion') || lower.includes('final') || lower.includes('wsdc')) {
    return '/DEBATE.jpeg';
  }
  if (lower.includes('academic') || lower.includes('school') || lower.includes('education') || lower.includes('scholarship')) {
    return '/ACADEMIC.jpeg';
  }
  if (lower.includes('youth') || lower.includes('leader') || lower.includes('summit') || lower.includes('volunteer')) {
    return '/YOUTH.jpeg';
  }
  if (lower.includes('mission') || lower.includes('peace') || lower.includes('community')) {
    return '/MISSION.jpeg';
  }
  if (lower.includes('gallery') || lower.includes('event') || lower.includes('photo')) {
    return '/group.jpg';
  }
  return '/yoccover.png';
}

/**
 * SafeImage component that gracefully handles loading states, 
 * broken image URLs, referrer security, immediate display, and renders elegant fallbacks.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Image',
  fallbackSrc,
  fallbackText,
  fallbackCategory,
  fallbackTitle,
  className = '',
  containerClassName = '',
  priority = false,
  loading,
  decoding = 'async',
  ...props
}) => {
  // Resolve initial candidate: if src is empty or points to ephemeral server container,
  // immediately resolve to a permanent contextual archive photo
  const getInitialSrc = (candidate?: string): string => {
    if (!candidate || candidate.startsWith('/uploads/') || candidate.includes('uploaded_image')) {
      return fallbackSrc || getContextualArchiveFallback(fallbackCategory, fallbackTitle || fallbackText || alt);
    }
    return candidate;
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getInitialSrc(src));
  const [hasError, setHasError] = useState<boolean>(false);
  const [triedArchiveFallback, setTriedArchiveFallback] = useState<boolean>(false);
  const [triedMasterFallback, setTriedMasterFallback] = useState<boolean>(false);

  useEffect(() => {
    const resolved = getInitialSrc(src);
    setImgSrc(resolved);
    setHasError(false);
    setTriedArchiveFallback(false);
    setTriedMasterFallback(false);
  }, [src, fallbackSrc, fallbackCategory, fallbackTitle, fallbackText, alt]);

  const handleImageError = () => {
    // Step 1: If an explicit fallbackSrc was provided and differs, try it
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      return;
    }

    // Step 2: Try contextual real archive photo fallback based on title/category
    if (!triedArchiveFallback) {
      setTriedArchiveFallback(true);
      const archiveUrl = getContextualArchiveFallback(fallbackCategory, fallbackTitle || fallbackText || alt);
      if (archiveUrl && imgSrc !== archiveUrl) {
        setImgSrc(archiveUrl);
        return;
      }
    }

    // Step 3: Try master brand cover fallback
    if (!triedMasterFallback && imgSrc !== '/yoccover.png') {
      setTriedMasterFallback(true);
      setImgSrc('/yoccover.png');
      return;
    }

    // Step 4: Final fail-safe
    setHasError(true);
  };

  if (hasError) {
    const displayText = fallbackTitle || fallbackText || alt;
    const categoryText = fallbackCategory ? fallbackCategory.toUpperCase() : 'YOUTH FOR CHANGE LIBERIA';

    return (
      <div 
        className={`w-full h-full min-h-[140px] bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-4 text-center select-none relative overflow-hidden ${containerClassName || className}`}
      >
        <div className="w-11 h-11 rounded-xl bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-yellow-400 mb-2.5 shadow-md">
          <ImageIcon className="w-5 h-5 text-amber-300" />
        </div>
        <span className="text-white font-bold text-xs tracking-tight max-w-[220px] line-clamp-2 drop-shadow-sm">
          {displayText}
        </span>
        <span className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mt-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
          {categoryText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={loading || 'eager'}
      decoding={decoding}
      // @ts-ignore
      fetchPriority={priority ? 'high' : ((props as any).fetchPriority || 'auto')}
      referrerPolicy="no-referrer"
      onError={handleImageError}
      className={className}
      {...props}
    />
  );
};


