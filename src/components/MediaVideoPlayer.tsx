import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Film,
  ExternalLink,
  Loader2,
  Sparkles,
  Tv,
  CheckCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  Info
} from 'lucide-react';
import { SafeImage, getContextualArchiveFallback } from './SafeImage';
import { getVideoBlobUrl, storeVideoBlob } from '../lib/mediaStorage';

interface MediaVideoPlayerProps {
  src?: string;
  videoEmbedUrl?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  showAttachButton?: boolean;
  onEnded?: () => void;
}

// Check if a URL is a direct HTML5 video file or uploaded stream
export function isPlayableVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:video') || trimmed.startsWith('blob:')) return true;
  if (trimmed.includes('/uploads/videos/') || trimmed.includes('/uploads/')) return true;
  if (/\.(mp4|webm|mov|m4v|mkv|ogv)(\?.*)?$/i.test(trimmed)) return true;
  if (trimmed.includes('firebasestorage.googleapis.com') && (trimmed.includes('video') || trimmed.includes('.mp4') || trimmed.includes('vid_'))) return true;
  return false;
}

// Check and parse external video embed services (YouTube, Vimeo, Google Drive)
export function parseVideoEmbed(url?: string): { type: 'youtube' | 'vimeo' | 'drive' | 'iframe'; embedUrl: string } | null {
  if (!url) return null;
  const trimmed = url.trim();

  // 1. YouTube (watch, youtu.be, embed, shorts, live)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  // 2. Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // 3. Google Drive preview
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // 4. Direct iframe embed link
  if (trimmed.startsWith('http') && (trimmed.includes('/embed') || trimmed.includes('/iframe'))) {
    return {
      type: 'iframe',
      embedUrl: trimmed
    };
  }

  return null;
}

export const MediaVideoPlayer: React.FC<MediaVideoPlayerProps> = ({
  src,
  videoEmbedUrl,
  poster,
  title = 'Tournament Match Video Replay',
  autoPlay = true,
  className = '',
  showAttachButton = false,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);

  // Compute permanent high-resolution poster so video never loses its cover page
  const resolvedPoster = React.useMemo(() => {
    if (poster && !poster.startsWith('/uploads/') && !poster.includes('uploaded_image')) {
      return poster;
    }
    // If YouTube link, extract YouTube HD cover
    const fullVideoRef = videoEmbedUrl || src || '';
    const ytMatch = fullVideoRef.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    return getContextualArchiveFallback('videos', title);
  }, [poster, videoEmbedUrl, src, title]);

  // Check if we have an explicit external embed provided (YouTube / Vimeo / Drive)
  const directEmbed = parseVideoEmbed(videoEmbedUrl) || (src && parseVideoEmbed(src));

  // Determine initial video source candidate
  const initialDirectSrc = isPlayableVideoUrl(src) 
    ? src 
    : (isPlayableVideoUrl(videoEmbedUrl) ? videoEmbedUrl : undefined);

  // Active playing source (can be local Blob URL from IndexedDB or direct server URL)
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | undefined>(initialDirectSrc);
  const [playerMode, setPlayerMode] = useState<'embed' | 'html5' | 'showcase'>(
    directEmbed ? 'embed' : (initialDirectSrc ? 'html5' : 'showcase')
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [wasAutoplayMuted, setWasAutoplayMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showPlayOverlay, setShowPlayOverlay] = useState<boolean>(!autoPlay);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [isLocalFileLoaded, setIsLocalFileLoaded] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<any>(null);

  // Check IndexedDB on mount or when src changes to load cached local video blob
  useEffect(() => {
    let isCancelled = false;

    const checkLocalCache = async () => {
      const targetSrc = src || videoEmbedUrl;
      if (!targetSrc) {
        // If no src passed, check if any latest video is stored in IndexedDB
        try {
          const latestBlob = await getVideoBlobUrl('__latest_uploaded_video__');
          if (!isCancelled && latestBlob) {
            setResolvedVideoSrc(latestBlob);
            setPlayerMode('html5');
            setVideoLoadError(null);
            setIsLocalFileLoaded(true);
            return;
          }
        } catch {}
        setPlayerMode('showcase');
        return;
      }

      // If already a blob URL or data URL, use it directly
      if (targetSrc.startsWith('blob:') || targetSrc.startsWith('data:video')) {
        setResolvedVideoSrc(targetSrc);
        setPlayerMode('html5');
        setVideoLoadError(null);
        return;
      }

      // Check IndexedDB with intelligent fuzzy matching
      try {
        const localBlob = await getVideoBlobUrl(targetSrc);
        if (!isCancelled && localBlob) {
          setResolvedVideoSrc(localBlob);
          setPlayerMode('html5');
          setVideoLoadError(null);
          setIsLocalFileLoaded(true);
          return;
        }
      } catch (err) {
        console.warn('Could not query local IndexedDB video cache:', err);
      }

      // Check if it's an external embed (YouTube / Vimeo / Drive)
      const embed = parseVideoEmbed(videoEmbedUrl) || parseVideoEmbed(src);
      if (embed) {
        setPlayerMode('embed');
        setVideoLoadError(null);
      } else if (isPlayableVideoUrl(targetSrc)) {
        setResolvedVideoSrc(targetSrc);
        setPlayerMode('html5');
        setVideoLoadError(null);
      } else {
        // Fallback: check if latest video exists in IndexedDB
        try {
          const latestBlob = await getVideoBlobUrl('__latest_uploaded_video__');
          if (!isCancelled && latestBlob) {
            setResolvedVideoSrc(latestBlob);
            setPlayerMode('html5');
            setVideoLoadError(null);
            setIsLocalFileLoaded(true);
            return;
          }
        } catch {}
        setPlayerMode('showcase');
      }
    };

    checkLocalCache();

    return () => {
      isCancelled = true;
    };
  }, [src, videoEmbedUrl]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      if (wasAutoplayMuted) {
        vid.muted = false;
        setIsMuted(false);
        setWasAutoplayMuted(false);
      }
      vid.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayOverlay(false);
        })
        .catch((err) => {
          console.warn('Autoplay audio gesture constraint, muting audio first:', err);
          vid.muted = true;
          setIsMuted(true);
          setWasAutoplayMuted(true);
          vid.play().then(() => {
            setIsPlaying(true);
            setShowPlayOverlay(false);
          }).catch(() => {
            setShowPlayOverlay(true);
          });
        });
    } else {
      vid.pause();
      setIsPlaying(false);
      setShowPlayOverlay(true);
    }
  }, [wasAutoplayMuted]);

  // Direct Click on Big Center Play Button
  const handleDirectPlay = () => {
    if (playerMode === 'showcase' && !resolvedVideoSrc) {
      // Trigger file picker to load the video from computer
      filePickerRef.current?.click();
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = false;
    setIsMuted(false);
    setWasAutoplayMuted(false);

    vid.play()
      .then(() => {
        setIsPlaying(true);
        setShowPlayOverlay(false);
      })
      .catch(() => {
        vid.muted = true;
        setIsMuted(true);
        setWasAutoplayMuted(true);
        vid.play().then(() => {
          setIsPlaying(true);
          setShowPlayOverlay(false);
        });
      });
  };

  // Handle direct file selection from local computer
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const blobUrl = URL.createObjectURL(file);
      setResolvedVideoSrc(blobUrl);
      setPlayerMode('html5');
      setVideoLoadError(null);
      setIsLocalFileLoaded(true);

      // Save to IndexedDB under the item src / title
      if (src) {
        await storeVideoBlob(src, file).catch(() => {});
      }
      await storeVideoBlob(file.name, file).catch(() => {});

      // Auto start video
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) {
          vid.src = blobUrl;
          vid.play().then(() => {
            setIsPlaying(true);
            setShowPlayOverlay(false);
          }).catch(() => {
            setShowPlayOverlay(true);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to load local video file:', err);
    }
  };

  // Unmute Audio handler
  const handleUnmuteAudio = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = false;
    setIsMuted(false);
    setWasAutoplayMuted(false);
    if (volume === 0) {
      setVolume(0.85);
      vid.volume = 0.85;
    }
  };

  // Mute / Unmute
  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
    setWasAutoplayMuted(false);
    if (nextMuted) {
      vid.volume = 0;
    } else {
      vid.volume = volume || 0.85;
    }
  };

  // Volume Slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const vid = videoRef.current;
    if (vid) {
      vid.volume = val;
      if (val === 0) {
        setIsMuted(true);
        vid.muted = true;
      } else {
        setIsMuted(false);
        vid.muted = false;
        setWasAutoplayMuted(false);
      }
    }
  };

  // Seek Timeline
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Playback Rate
  const cyclePlaybackRate = () => {
    if (!videoRef.current) return;
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // Restart
  const handleRestart = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().then(() => {
      setIsPlaying(true);
      setShowPlayOverlay(false);
    });
  };

  // Setup HTML5 event listeners
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || playerMode !== 'html5' || !resolvedVideoSrc) return;

    const onTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
      if (vid.buffered && vid.buffered.length > 0) {
        try {
          setBufferedEnd(vid.buffered.end(vid.buffered.length - 1));
        } catch (e) {}
      }
    };

    const onLoadedMetadata = () => {
      setDuration(vid.duration || 0);
      setVideoLoadError(null);

      if (autoPlay) {
        vid.play()
          .then(() => {
            setIsPlaying(true);
            setShowPlayOverlay(false);
          })
          .catch(() => {
            vid.muted = true;
            setIsMuted(true);
            setWasAutoplayMuted(true);
            vid.play()
              .then(() => {
                setIsPlaying(true);
                setShowPlayOverlay(false);
              })
              .catch(() => {
                setShowPlayOverlay(true);
              });
          });
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      setShowPlayOverlay(false);
      setIsBuffering(false);
    };

    const onPause = () => {
      setIsPlaying(false);
      setShowPlayOverlay(true);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onEndedEvent = () => {
      setIsPlaying(false);
      setShowPlayOverlay(true);
      if (onEnded) onEnded();
    };

    const onError = async () => {
      console.warn('HTML5 Video could not stream from source:', resolvedVideoSrc);
      
      // Attempt to retrieve cached blob from IndexedDB before showing error UI
      const targetSrc = src || videoEmbedUrl;
      if (targetSrc) {
        try {
          const cached = await getVideoBlobUrl(targetSrc);
          if (cached && cached !== resolvedVideoSrc) {
            setResolvedVideoSrc(cached);
            setVideoLoadError(null);
            return;
          }
        } catch {}
      }

      try {
        const latestBlob = await getVideoBlobUrl('__latest_uploaded_video__');
        if (latestBlob && latestBlob !== resolvedVideoSrc) {
          setResolvedVideoSrc(latestBlob);
          setVideoLoadError(null);
          return;
        }
      } catch {}

      setVideoLoadError('This match video file is not available on this server session. You can re-select the video file from your computer below for instant Full HD playback, or stream a sample match recording.');
    };

    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('loadedmetadata', onLoadedMetadata);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('playing', onPlaying);
    vid.addEventListener('ended', onEndedEvent);
    vid.addEventListener('error', onError);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('loadedmetadata', onLoadedMetadata);
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('playing', onPlaying);
      vid.removeEventListener('ended', onEndedEvent);
      vid.removeEventListener('error', onError);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resolvedVideoSrc, autoPlay, onEnded, playerMode]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 1. EXTERNAL EMBED PLAYER (For YouTube, Vimeo, Google Drive links explicitly provided)
  if (playerMode === 'embed' && directEmbed) {
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 ${className}`}>
        <iframe
          src={directEmbed.embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // 2. VIDEO STREAM ERROR OR SERVER EXPIRATION STATE (Never fall back to YouTube!)
  if (videoLoadError) {
    return (
      <div className={`relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-center p-6 text-center select-none ${className}`}>
        {resolvedPoster && (
          <div className="absolute inset-0 opacity-20">
            <SafeImage
              src={resolvedPoster}
              alt={title}
              fallbackCategory="gallery"
              fallbackTitle={title}
              className="w-full h-full object-cover filter blur-xs"
            />
          </div>
        )}

        <div className="relative z-20 max-w-lg space-y-4 text-white">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center mx-auto shadow-xl">
            <Film className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This match video was uploaded from your computer. Select the file from your computer to play it directly in your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {showAttachButton && (
              <button
                type="button"
                onClick={() => filePickerRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select Video from Computer</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                // Play sample match stream
                setResolvedVideoSrc('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                setPlayerMode('html5');
                setVideoLoadError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Sample Tournament Clip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVideoLoadError(null);
                const vid = videoRef.current;
                if (vid && resolvedVideoSrc) {
                  vid.load();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input for direct computer re-link if enabled in admin */}
        {showAttachButton && (
          <input
            ref={filePickerRef}
            type="file"
            accept="video/*,.mp4,.webm,.mov,.m4v,.mkv"
            onChange={handleLocalFileSelect}
            className="hidden"
          />
        )}
      </div>
    );
  }

  // 3. SHOWCASE PREVIEW PLAYER (For entries waiting for video playback)
  if (playerMode === 'showcase' && !resolvedVideoSrc) {
    return (
      <div className={`relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-white/10 flex items-center justify-center select-none group ${className}`}>
        {resolvedPoster ? (
          <SafeImage
            src={resolvedPoster}
            alt={title}
            fallbackCategory="gallery"
            fallbackTitle={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-black flex items-center justify-center">
            <Film className="w-16 h-16 text-emerald-500/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 flex flex-col justify-between p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-lg">
              <Tv className="w-3.5 h-3.5" /> Official Match Recording
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Full HD Broadcast
            </div>
          </div>

          {/* Center Action */}
          <div className="flex flex-col items-center justify-center space-y-4 my-auto cursor-pointer" onClick={handleDirectPlay}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-400 hover:bg-yellow-300 text-emerald-950 flex items-center justify-center shadow-2xl transform group-hover:scale-110 active:scale-95 transition-all duration-300">
              <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1.5" />
            </div>
            <button
              type="button"
              className="px-6 py-2.5 rounded-full bg-slate-900/90 hover:bg-black text-white font-extrabold text-xs sm:text-sm tracking-wide border border-white/20 shadow-2xl flex items-center gap-2 transition-all group-hover:border-yellow-400"
            >
              <span>Play Video Recording</span>
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-2xl font-black text-white line-clamp-1 drop-shadow-md">
              {title}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
              National Debate League match recording and speaker speeches.
            </p>
          </div>
        </div>

        <input
          ref={filePickerRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.m4v,.mkv"
          onChange={handleLocalFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // 4. DIRECT HTML5 VIDEO PLAYER (For uploaded MP4, WebM, MOV files from computer or server)
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-black select-none group shadow-2xl flex items-center justify-center border border-white/10 ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={resolvedVideoSrc}
        poster={resolvedPoster}
        playsInline
        preload="auto"
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md flex items-center gap-3 text-white text-xs font-bold shadow-xl border border-white/10">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
            <span>Buffering Video...</span>
          </div>
        </div>
      )}

      {/* Tap to Unmute Overlay */}
      {isPlaying && wasAutoplayMuted && (
        <button
          type="button"
          onClick={handleUnmuteAudio}
          className="absolute top-4 left-4 z-30 px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-emerald-950 text-xs font-extrabold shadow-2xl flex items-center gap-2 border border-yellow-200 cursor-pointer animate-bounce transition-all active:scale-95"
        >
          <VolumeX className="w-4 h-4" />
          <span>Tap to Unmute Audio 🔊</span>
        </button>
      )}

      {/* Big Center Play Button Overlay */}
      {showPlayOverlay && (
        <div
          onClick={handleDirectPlay}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1.5" />
          </div>
          <p className="mt-4 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white font-bold text-xs tracking-wider border border-white/20 shadow-lg">
            Click to Play Video Replay
          </p>
        </div>
      )}

      {/* Custom Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Timeline */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="relative w-full h-2.5 bg-white/20 hover:h-3.5 rounded-full overflow-hidden cursor-pointer transition-all duration-150 mb-2.5"
        >
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full shadow-sm"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3 text-white text-xs font-semibold">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="p-2 rounded-lg bg-white/10 hover:bg-yellow-400 hover:text-emerald-950 text-white transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              title="Restart"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hidden sm:flex"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-300" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 accent-yellow-400 cursor-pointer"
              />
            </div>

            {/* Timestamp */}
            <span className="font-mono text-[11px] sm:text-xs text-slate-300 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {showAttachButton && (
              <button
                type="button"
                onClick={() => filePickerRef.current?.click()}
                title="Re-attach / Pick video file from computer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hidden md:flex items-center gap-1 text-[11px]"
              >
                <Upload className="w-3.5 h-3.5 text-yellow-400" />
                <span>Attach File</span>
              </button>
            )}

            <button
              type="button"
              onClick={cyclePlaybackRate}
              title="Playback Speed"
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-yellow-400 border border-white/10 cursor-pointer"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg bg-white/10 hover:bg-yellow-400 hover:text-emerald-950 text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for instant local playback when enabled */}
      {showAttachButton && (
        <input
          ref={filePickerRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.m4v,.mkv"
          onChange={handleLocalFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
};
