import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { 
  UploadCloud, 
  Film, 
  X, 
  Check, 
  Play, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Maximize2 
} from 'lucide-react';
import { processVideoFile, formatFileSize } from '../lib/videoUtils';
import { getVideoBlobUrl } from '../lib/mediaStorage';
import { useToast } from '../context/ToastContext';

export interface VideoUploadFieldProps {
  value: string; // video dataUrl or videoUrl
  onChange: (value: string) => void;
  onDurationExtracted?: (duration: string, durationSeconds?: number) => void;
  onAutoPosterExtracted?: (posterUrl: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  id?: string;
  maxDurationSeconds?: number; // Optional limit (e.g. 600s = 10 minutes)
}

export const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
  value,
  onChange,
  onDurationExtracted,
  onAutoPosterExtracted,
  label = 'Upload Video File from Computer',
  helperText = 'Select or drag & drop an MP4, WebM, MOV, or M4V video recording directly from your computer.',
  required = false,
  className = '',
  id,
  maxDurationSeconds
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [bytesTotal, setBytesTotal] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoStats, setVideoStats] = useState<{
    name?: string;
    size?: number;
    duration?: string;
    width?: number;
    height?: number;
  } | null>(null);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>(value);

  // Sync activeVideoSrc and query local storage for immediate playback
  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setActiveVideoSrc('');
      return;
    }
    if (value.startsWith('blob:') || value.startsWith('data:video')) {
      setActiveVideoSrc(value);
      return;
    }
    getVideoBlobUrl(value).then((cached) => {
      if (isMounted) {
        setActiveVideoSrc(cached || value);
      }
    }).catch(() => {
      if (isMounted) {
        setActiveVideoSrc(value);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [value]);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v|mkv|avi)$/i)) {
      setErrorMsg('Please select a valid video file (MP4, WebM, MOV, M4V, MKV).');
      toast.error('Invalid file format. Please select an MP4 or WebM video file.', 'Invalid Video');
      return;
    }

    // Support large video recordings up to 2GB (2048MB)
    const maxSizeBytes = 2048 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`Video file exceeds 2GB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a compressed video or trim clip length.`);
      toast.warning('Selected video exceeds 2GB limit. Please compress or trim the video.', 'File Exceeds 2GB');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setUploadProgress(0);
    setBytesUploaded(0);
    setBytesTotal(file.size);

    try {
      const result = await processVideoFile(file, (percent, loaded, total) => {
        setUploadProgress(percent);
        setBytesUploaded(loaded);
        setBytesTotal(total);
      });

      // Prefer clean lightweight server url if uploaded, or fallback to dataUrl
      const finalUrl = result.serverUrl || result.dataUrl;
      onChange(finalUrl);

      setVideoStats({
        name: result.name,
        size: result.size,
        duration: result.durationFormatted,
        width: result.width,
        height: result.height
      });

      if (maxDurationSeconds && result.durationSeconds > maxDurationSeconds) {
        const maxMins = Math.round(maxDurationSeconds / 60);
        toast.warning(
          `Video duration (${result.durationFormatted}) exceeds the recommended ${maxMins}-minute limit for testimonials.`,
          'Video Duration Notice',
          5000
        );
      }

      if (onDurationExtracted && result.durationFormatted) {
        onDurationExtracted(result.durationFormatted, result.durationSeconds);
      }

      if (onAutoPosterExtracted && result.autoPosterDataUrl) {
        onAutoPosterExtracted(result.autoPosterDataUrl);
      }

      toast.success(
        `Video "${result.name}" (${formatFileSize(result.size)}) uploaded successfully! Duration: ${result.durationFormatted}.`,
        'Video Uploaded',
        4000
      );
    } catch (err: any) {
      console.error('Video upload error:', err);
      const msg = err.message || 'Failed to process video file.';
      setErrorMsg(msg);
      toast.error(msg, 'Video Upload Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileProcess(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setVideoStats(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasValidVideo = Boolean(value && value.trim().length > 0);

  return (
    <div className={`space-y-2 text-left ${className}`} id={id}>
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-emerald-700" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {hasValidVideo && (
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3 text-emerald-700" /> Video Ready
          </span>
        )}
      </div>

      {/* Main Drag-Drop / Preview Container */}
      <div className="relative">
        {hasValidVideo ? (
          /* Video Player Preview Screen */
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-slate-950 overflow-hidden shadow-lg space-y-0 relative group">
            <div className="relative aspect-video w-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={activeVideoSrc || value}
                controls
                playsInline
                className="w-full h-full max-h-[320px] object-contain rounded-t-xl"
              />
            </div>

            {/* Bottom Bar: File Meta & Replace / Clear Button */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Film className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-100 truncate text-[11px]">
                    {videoStats?.name || 'Uploaded Video File'}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-2">
                    {videoStats?.size ? (
                      <span>{formatFileSize(videoStats.size)}</span>
                    ) : null}
                    {videoStats?.duration ? (
                      <span className="flex items-center gap-0.5 text-emerald-300">
                        <Clock className="w-2.5 h-2.5" /> {videoStats.duration}
                      </span>
                    ) : null}
                    {videoStats?.width && videoStats?.height ? (
                      <span>{videoStats.width}x{videoStats.height}</span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Choose Another Video</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                  title="Remove video file"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Drag & Drop Upload Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 relative ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/70 hover:bg-emerald-50/40 hover:border-emerald-500'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-6 px-4 w-full max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Film className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="w-full space-y-2 text-center">
                  <p className="text-xs font-black text-slate-900">
                    {uploadProgress < 100 
                      ? `Uploading Video: ${uploadProgress}%`
                      : 'Finalizing Video & Generating Preview Poster...'}
                  </p>
                  
                  {/* Real-time Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner relative">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>
                      {bytesTotal > 0 
                        ? `${(bytesUploaded / (1024 * 1024)).toFixed(1)} MB / ${(bytesTotal / (1024 * 1024)).toFixed(1)} MB`
                        : 'Streaming binary chunks...'}
                    </span>
                    <span>{uploadProgress}% complete</span>
                  </div>
                </div>

                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Please keep this window open while the video uploads.
                </span>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-bold text-slate-900">
                    Click to browse or Drag & Drop Video File
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload directly from your computer. Supports MP4, WebM, MOV, M4V (high-resolution files up to 2GB).
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors">
                  <Film className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Choose Video File from Computer</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*,.mp4,.webm,.mov,.m4v,.mkv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !errorMsg && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{helperText}</p>
      )}
    </div>
  );
};
