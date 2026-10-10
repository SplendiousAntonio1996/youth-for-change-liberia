import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Calendar, Eye, X, 
  MapPin, Clock, Tag, Sparkles, RefreshCw, ExternalLink, Film, Building2,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Info, Share2, Copy, Check, Layers, Play, ShieldCheck
} from 'lucide-react';
import { GallerySubTab, GalleryItem, NavTab } from '../types';
import { GALLERY_ITEMS } from '../data/contentData';
import { GalleryGridSkeleton } from './SkeletonLoaders';
import { SafeImage, getContextualArchiveFallback } from './SafeImage';
import { MediaVideoPlayer } from './MediaVideoPlayer';
import { useToast } from '../context/ToastContext';
import { useGalleryMedia } from '../hooks/useGalleryMedia';
import { PageHeroBanner } from './PageHeroBanner';

interface GalleryViewProps {
  gallerySub: GallerySubTab;
  setGallerySub: (sub: GallerySubTab) => void;
  setTab: (tab: NavTab) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  gallerySub,
  setGallerySub,
  setTab
}) => {
  const toast = useToast();
  const { 
    allMedia: liveItems, 
    loading: isMediaLoading, 
    refetch: refetchMedia,
    reverify: reverifyMedia,
    isVerifying,
    isStale,
    lastVerifiedAt
  } = useGalleryMedia();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showCaption, setShowCaption] = useState<boolean>(true);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Touch Swipe State for Mobile Lightbox
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Trigger brief view transition when subtab or tag filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [gallerySub, selectedTag]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await refetchMedia(true);
    setIsLoading(false);
  };

  const handleReverifyAll = async () => {
    setIsLoading(true);
    await reverifyMedia();
    setIsLoading(false);
  };

  const filteredItems = liveItems.filter(item => {
    const matchesCategory = item.category === gallerySub;
    const matchesTag = selectedTag === 'All' || item.tag === selectedTag;
    return matchesCategory && matchesTag;
  });

  const availableTags = ['All', ...Array.from(new Set(liveItems.filter(i => i.category === gallerySub).map(i => i.tag)))];

  const photosCount = liveItems.filter(i => i.category === 'photos').length;
  const videosCount = liveItems.filter(i => i.category === 'videos').length;
  const eventsCount = liveItems.filter(i => i.category === 'events').length;

  const currentItem = lightboxIndex !== null && filteredItems[lightboxIndex] ? filteredItems[lightboxIndex] : null;

  const formatYouTubeEmbed = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };

  // Lightbox Navigation Handlers
  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsZoomed(false);
  };

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
    setIsZoomed(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handlePrevItem = useCallback(() => {
    if (filteredItems.length === 0) return;
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + filteredItems.length) % filteredItems.length;
    });
    setIsZoomed(false);
  }, [filteredItems.length]);

  const handleNextItem = useCallback(() => {
    if (filteredItems.length === 0) return;
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % filteredItems.length;
    });
    setIsZoomed(false);
  }, [filteredItems.length]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsBrowserFullscreen(true);
      }).catch(() => {
        setIsBrowserFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsBrowserFullscreen(false);
      }).catch(() => {
        setIsBrowserFullscreen(false);
      });
    }
  };

  const handleCopyLink = () => {
    if (!currentItem) return;
    const shareUrl = window.location.href.split('#')[0] + `#gallery-${currentItem.id}`;
    navigator.clipboard.writeText(currentItem.url || shareUrl);
    setCopiedLink(true);
    toast.success(`Copied direct media link for "${currentItem.title}"`, 'Link Copied');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Keyboard navigation listener
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrevItem();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNextItem();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowCaption(prev => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleCloseLightbox, handlePrevItem, handleNextItem]);

  // Touch Swipe Handlers for Mobile Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go Next
      handleNextItem();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      handlePrevItem();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (lightboxIndex !== null && thumbnailsRef.current) {
      const activeEl = thumbnailsRef.current.children[lightboxIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [lightboxIndex]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner */}
      <PageHeroBanner
        category="CAPTURING EXCELLENCE ACROSS 15 COUNTIES"
        badge="OFFICIAL VISUAL ARCHIVE"
        title="CHAMPIONSHIP MEDIA & PHOTO ARCHIVE"
        subtitle="High-resolution photo moments from tournament debates, STEM showcases, trophy ceremonies, and school delegations across Liberia."
        bgImage="/youth.jpg"
        stats={[
          { label: 'Photo Records', value: `${photosCount}` },
          { label: 'Videos & Matches', value: `${videosCount}` },
          { label: 'Liberian Counties', value: '15' },
          { label: 'Archive Period', value: '2015–2025' }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              setGallerySub('photos');
              setSelectedTag('All');
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              gallerySub === 'photos'
                ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            Photo Albums ({photosCount})
          </button>
          <button
            onClick={() => {
              setGallerySub('videos');
              setSelectedTag('All');
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              gallerySub === 'videos'
                ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            Videos & Matches ({videosCount})
          </button>
          <button
            onClick={() => {
              setGallerySub('events');
              setSelectedTag('All');
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              gallerySub === 'events'
                ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            Key Events ({eventsCount})
          </button>
        </div>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Tag filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#063d2e] text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRefresh}
              title="Re-fetch fresh media from Firestore"
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
              <span className="hidden sm:inline">Re-fetch Cloud</span>
            </button>

            <button
              type="button"
              onClick={handleReverifyAll}
              disabled={isVerifying}
              title="Re-verify all media links against Firestore and repair stale/ephemeral links"
              className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-bounce text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isVerifying ? 'Verifying...' : 'Re-verify Media'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Firestore Cloud Persisted & Verified</span>
          {lastVerifiedAt && (
            <span className="text-slate-400">• Last checked {lastVerifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {isStale && (
            <button
              onClick={() => refetchMedia(true)}
              className="text-amber-700 hover:underline font-bold ml-1 cursor-pointer"
            >
              (Stale Cache - Re-fetch)
            </button>
          )}
        </div>
      </div>

      {/* Tag Filters */}
      {!isLoading && availableTags.length > 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedTag === tag 
                  ? 'bg-yellow-400 text-emerald-950 font-extrabold shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Gallery Items Grid or Skeleton */}
      {isLoading ? (
        <GalleryGridSkeleton />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            {gallerySub === 'photos' ? <Camera className="w-8 h-8" /> : gallerySub === 'videos' ? <Film className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              No {gallerySub === 'photos' ? 'Photos' : gallerySub === 'videos' ? 'Videos or Matches' : 'Events'} Published Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {gallerySub === 'videos'
                ? 'No video recordings are currently published in this category. Administrators can upload debate clips, finals, and youth documentaries in the Admin Portal.'
                : 'The public gallery is currently empty. Administrators can upload tournament albums and summit moments directly from the Admin Portal.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setTab('admin')}
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Go to Admin Portal to Add Media</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleOpenLightbox(index)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-2xl hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between transform hover:-translate-y-1 duration-200"
            >
              <div>
                <div className="h-60 overflow-hidden relative bg-slate-950">
                  <SafeImage
                    src={item.url}
                    alt={item.title}
                    fallbackCategory="gallery"
                    fallbackTitle={item.title}
                    priority={index < 6}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-emerald-950/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs shadow-sm">
                    {item.editionYear}
                  </span>

                  {item.category === 'videos' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-emerald-500 transition-all">
                        <Play className="w-6 h-6 fill-white translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {item.category === 'photos' && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-2 rounded-xl backdrop-blur-xs flex items-center gap-1 text-[11px] font-bold shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </div>
                  )}

                  {item.category === 'events' && item.venue && (
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                      <span className="truncate">{item.venue}</span>
                    </div>
                  )}

                  {item.duration && (
                    <span className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-400" /> {item.duration}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {item.county} County
                    </span>
                    <span className="text-slate-500 font-medium">{item.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.category === 'events' && item.eventTime && (
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3 text-emerald-700" />
                      <span>{item.eventTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                  {item.tag}
                </span>
                <span className="text-emerald-800 font-bold flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                  <Eye className="w-3.5 h-3.5" />
                  {item.category === 'videos' ? 'Watch Full Screen' : item.category === 'events' ? 'Expand Event' : 'Open Lightbox'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL-SCREEN INTERACTIVE LIGHTBOX VIEW */}
      {currentItem && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between text-white select-none overflow-hidden animate-in fade-in duration-200"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Lightbox Navigation Bar */}
          <div className="relative z-30 px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-3 border-b border-white/10">
            {/* Left: Info Indicators */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-mono font-bold tracking-wider shrink-0 border border-white/15">
                {lightboxIndex + 1} / {filteredItems.length}
              </span>
              <div className="hidden sm:flex items-center gap-2 truncate">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase">
                  {currentItem.tag}
                </span>
                <span className="text-xs text-slate-300 font-semibold truncate">
                  {currentItem.editionYear} • {currentItem.county} County
                </span>
              </div>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentItem.category === 'photos' && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(prev => !prev)}
                  title={isZoomed ? "Zoom Out (Z)" : "Zoom In (Z)"}
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isZoomed 
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-md font-bold' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCaption(prev => !prev)}
                title="Toggle Caption & Details (I)"
                className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                  showCaption 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 opacity-70'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowThumbnails(prev => !prev)}
                title="Toggle Thumbnails Filmstrip"
                className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                  showThumbnails 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 opacity-70'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Media Link"
                className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                title="Toggle Fullscreen (F)"
                className="hidden sm:inline-flex p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              >
                {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseLightbox}
                title="Close Lightbox (Esc)"
                className="p-2 sm:p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/50 transition-all cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Stage Area: Prev, Main Media, Next */}
          <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Floating Previous Button */}
            <button
              type="button"
              onClick={handlePrevItem}
              title="Previous Image (← or A)"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl cursor-pointer active:scale-95 group"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Floating Next Button */}
            <button
              type="button"
              onClick={handleNextItem}
              title="Next Image (→ or D)"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl cursor-pointer active:scale-95 group"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Central Media Content */}
            <div className="w-full h-full flex items-center justify-center max-w-6xl mx-auto p-2 sm:p-4">
              {currentItem.category === 'videos' ? (
                <div className="w-full max-w-4xl max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                  <MediaVideoPlayer
                    src={currentItem.videoUrl || currentItem.url}
                    videoEmbedUrl={currentItem.videoEmbedUrl}
                    poster={currentItem.url}
                    title={currentItem.title}
                    autoPlay={true}
                    className="w-full h-auto max-h-[72vh] rounded-xl"
                  />
                </div>
              ) : (
                <div 
                  className={`relative flex items-center justify-center max-h-full max-w-full transition-all duration-300 ${
                    isZoomed ? 'overflow-auto cursor-zoom-out p-4' : 'cursor-zoom-in'
                  }`}
                  onClick={() => {
                    if (currentItem.category === 'photos') {
                      setIsZoomed(prev => !prev);
                    }
                  }}
                >
                  <SafeImage
                    src={currentItem.url}
                    alt={currentItem.title}
                    fallbackCategory="gallery"
                    fallbackTitle={currentItem.title}
                    priority
                    className={`rounded-xl object-contain shadow-2xl transition-transform duration-300 select-none ${
                      isZoomed 
                        ? 'max-h-[140vh] scale-125 md:scale-150 transform' 
                        : 'max-h-[62vh] sm:max-h-[68vh] md:max-h-[72vh] w-auto'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Control & Caption Container */}
          <div className="relative z-30 flex flex-col bg-gradient-to-t from-black/95 via-black/85 to-transparent border-t border-white/10">
            {/* Expandable Caption Drawer */}
            {showCaption && (
              <div className="px-4 sm:px-8 py-3.5 max-w-5xl mx-auto w-full space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                    {currentItem.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-emerald-300 shrink-0">
                    <span className="flex items-center gap-1 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                      {currentItem.county} County
                    </span>
                    <span className="text-slate-400 font-medium">{currentItem.date}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {currentItem.description}
                </p>

                {/* Specific Details for Events */}
                {currentItem.category === 'events' && (
                  <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-amber-200">
                    {currentItem.venue && (
                      <span className="flex items-center gap-1 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" /> Venue: {currentItem.venue}
                      </span>
                    )}
                    {currentItem.eventTime && (
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {currentItem.eventTime}
                      </span>
                    )}
                    {currentItem.registrationLink && (
                      <a
                        href={currentItem.registrationLink.startsWith('http') ? currentItem.registrationLink : `mailto:${currentItem.registrationLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-lg transition-colors text-xs ml-auto cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Register / RSVP</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Filmstrip */}
            {showThumbnails && filteredItems.length > 1 && (
              <div className="px-4 sm:px-6 py-2.5 border-t border-white/5 bg-black/40">
                <div 
                  ref={thumbnailsRef}
                  className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-white/20 max-w-5xl mx-auto"
                >
                  {filteredItems.map((item, idx) => {
                    const isSelected = idx === lightboxIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenLightbox(idx)}
                        title={item.title}
                        className={`relative shrink-0 w-14 h-10 sm:w-18 sm:h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-yellow-400 ring-2 ring-yellow-400/40 scale-105 shadow-lg opacity-100' 
                            : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                        }`}
                      >
                        <SafeImage
                          src={item.url}
                          alt={item.title}
                          fallbackCategory="gallery"
                          fallbackTitle={item.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keyboard shortcut hint bar */}
            <div className="hidden sm:flex items-center justify-center gap-4 py-1.5 text-[10px] text-slate-400 bg-black/60 border-t border-white/5 font-mono">
              <span>← / → Navigate</span>
              <span>•</span>
              <span>Z Zoom</span>
              <span>•</span>
              <span>I Caption</span>
              <span>•</span>
              <span>F Fullscreen</span>
              <span>•</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
