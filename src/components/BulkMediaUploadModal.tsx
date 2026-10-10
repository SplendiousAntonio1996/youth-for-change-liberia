import React, { useState, useRef, useEffect, DragEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Play,
  RotateCcw,
  FileCheck,
  Plus
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { optimizeImageFile, formatBytes } from '../lib/imageUtils';
import { uploadVideoBinary, formatDuration, formatFileSize } from '../lib/videoUtils';
import { storeVideoBlob } from '../lib/mediaStorage';
import { getContextualArchiveFallback } from './SafeImage';
import { useToast } from '../context/ToastContext';

export interface StagedMediaItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'photos' | 'videos';
  title: string;
  category: 'photos' | 'videos';
  editionYear: string;
  county: string;
  tag: string;
  description: string;
  date: string;
  duration?: string;
  previewUrl: string;
  status: 'ready' | 'uploading' | 'saving' | 'completed' | 'error';
  progress: number;
  errorMessage?: string;
  uploadedUrl?: string;
  posterUrl?: string;
}

interface BulkMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  defaultCounty?: string;
  defaultEditionYear?: string;
  countiesList?: string[];
  onUploadComplete?: () => void;
}

const DEFAULT_COUNTIES = [
  'National',
  'Montserrado',
  'Nimba',
  'Bong',
  'Margibi',
  'Grand Bassa',
  'Lofa',
  'Maryland',
  'Sinoe',
  'Grand Cape Mount',
  'Grand Gedeh',
  'River Gee',
  'Rivercess',
  'Bomi',
  'Grand Kru',
  'Gbarpolu'
];

const COMMON_TAGS = [
  'Debate Finals',
  'Championship',
  'STEM Expo',
  'Key Highlights',
  'Award Ceremony',
  'Adjudication',
  'County Workshop',
  'Opening Day',
  'Full Match Video',
  'Youth Summit'
];

export const BulkMediaUploadModal: React.FC<BulkMediaUploadModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  defaultCounty = 'Montserrado',
  defaultEditionYear = '2024/25',
  countiesList = DEFAULT_COUNTIES,
  onUploadComplete
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stagedItems, setStagedItems] = useState<StagedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);

  // Batch Defaults
  const [batchCounty, setBatchCounty] = useState<string>(defaultCounty);
  const [batchYear, setBatchYear] = useState<string>(defaultEditionYear);
  const [batchTag, setBatchTag] = useState<string>('Debate Finals');
  const [batchDate, setBatchDate] = useState<string>(
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  // Clean filename into human readable title
  const sanitizeFilenameToTitle = (filename: string): string => {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const clean = baseName
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Capitalize first letter of each word
    return clean
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Detect file type
  const detectFileType = (file: File): 'photos' | 'videos' => {
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|ogv)$/i.test(file.name)) {
      return 'videos';
    }
    return 'photos';
  };

  // Add files to staged queue
  const stageFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: StagedMediaItem[] = [];

    for (const file of fileArray) {
      const type = detectFileType(file);
      const id = 'stage_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const title = sanitizeFilenameToTitle(file.name);
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        name: file.name,
        size: file.size,
        type,
        title: title || (type === 'videos' ? 'Tournament Match Recording' : 'Championship Photo'),
        category: type,
        editionYear: batchYear,
        county: batchCounty,
        tag: type === 'videos' ? 'Full Match Video' : batchTag,
        description: type === 'videos' 
          ? 'Recorded tournament debate match and adjudication session.' 
          : 'High-resolution official photography from the tournament.',
        date: batchDate,
        previewUrl,
        status: 'ready',
        progress: 0
      });
    }

    setStagedItems(prev => [...prev, ...newItems]);
    toast.info(`Added ${newItems.length} file${newItems.length > 1 ? 's' : ''} to bulk upload queue.`, 'Files Staged');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(e.target.files);
      e.target.value = '';
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
      stageFiles(e.dataTransfer.files);
    }
  };

  // Remove individual staged item
  const removeStagedItem = (id: string) => {
    setStagedItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  // Clear all staged items
  const clearAllStaged = () => {
    stagedItems.forEach(item => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setStagedItems([]);
  };

  // Apply batch presets to all staged items
  const applyBatchPresetsToAll = () => {
    setStagedItems(prev =>
      prev.map(item => ({
        ...item,
        county: batchCounty,
        editionYear: batchYear,
        tag: item.type === 'videos' && batchTag === 'Debate Finals' ? 'Full Match Video' : batchTag,
        date: batchDate
      }))
    );
    toast.success('Applied batch settings (County, Year, Tag) to all staged files.', 'Settings Applied');
  };

  // Update item field
  const updateItemField = (id: string, field: keyof StagedMediaItem, value: any) => {
    setStagedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Perform upload for a single item
  const uploadSingleItem = async (item: StagedMediaItem): Promise<void> => {
    try {
      // Step 1: Mark as uploading
      updateItemField(item.id, 'status', 'uploading');
      updateItemField(item.id, 'progress', 25);

      let mediaUrl = '';
      let posterUrl: string | undefined = undefined;
      let durationFormatted: string = item.duration || '';

      if (item.type === 'videos') {
        // Upload video binary directly to server streaming store with progress updates
        const uploadRes = await uploadVideoBinary(item.file, 'video', (percent) => {
          updateItemField(item.id, 'progress', Math.min(85, Math.round(percent * 0.85)));
        });
        mediaUrl = uploadRes.url;
        try {
          await storeVideoBlob(mediaUrl, item.file);
          await storeVideoBlob(item.file.name, item.file);
        } catch (e) {}
        updateItemField(item.id, 'progress', 85);

        // Attempt video thumbnail generation via canvas
        try {
          const videoElem = document.createElement('video');
          videoElem.preload = 'metadata';
          videoElem.src = item.previewUrl;
          videoElem.muted = true;
          videoElem.playsInline = true;

          await new Promise<void>((resolve) => {
            videoElem.onloadedmetadata = () => {
              durationFormatted = formatDuration(videoElem.duration || 0);
              videoElem.currentTime = Math.min(1.0, (videoElem.duration || 0) * 0.1);
            };
            videoElem.onseeked = () => {
              const canvas = document.createElement('canvas');
              canvas.width = Math.min(videoElem.videoWidth || 720, 720);
              canvas.height = Math.round((canvas.width * (videoElem.videoHeight || 405)) / (videoElem.videoWidth || 720));
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
                posterUrl = canvas.toDataURL('image/jpeg', 0.72);
              }
              resolve();
            };
            videoElem.onerror = () => resolve();
            setTimeout(() => resolve(), 3000); // Timeout guard
          });
        } catch (thumbErr) {
          console.warn('Video thumbnail capture skipped:', thumbErr);
        }
      } else {
        // Picture upload: Optimize picture for permanent Firestore storage (<70KB)
        updateItemField(item.id, 'progress', 50);
        const optimized = await optimizeImageFile(item.file, {
          maxWidth: 960,
          maxHeight: 720,
          quality: 0.78
        });

        updateItemField(item.id, 'progress', 80);
        // Use optimized permanent data URL so image never disappears on server restart
        mediaUrl = optimized.dataUrl;
      }

      // Step 2: Mark as saving to Firestore
      updateItemField(item.id, 'status', 'saving');
      updateItemField(item.id, 'progress', 90);

      const finalCoverUrl = item.category === 'photos'
        ? (mediaUrl || getContextualArchiveFallback('photos', item.title))
        : (posterUrl || getContextualArchiveFallback('videos', item.title));

      // Step 3: Save to Firestore database
      await addDoc(collection(db, 'galleryItems'), {
        title: item.title,
        category: item.category,
        editionYear: item.editionYear || '2024/25',
        county: item.county || 'Montserrado',
        url: finalCoverUrl,
        posterUrl: finalCoverUrl,
        videoUrl: item.category === 'videos' ? mediaUrl : null,
        description: item.description || (item.category === 'videos' ? 'Official match recording.' : 'Official tournament photo.'),
        date: item.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        tag: item.tag || (item.category === 'videos' ? 'Full Match Video' : 'Debate Finals'),
        duration: item.category === 'videos' ? (durationFormatted || item.duration || '25m') : null,
        createdAt: new Date().toISOString(),
        authorEmail: userEmail || 'admin@youthforchange.org.lr',
        isVerified: true,
        lastVerifiedAt: new Date().toISOString()
      });

      // Step 4: Mark complete
      updateItemField(item.id, 'status', 'completed');
      updateItemField(item.id, 'progress', 100);
      updateItemField(item.id, 'uploadedUrl', mediaUrl);
    } catch (err: any) {
      console.error(`Error uploading item ${item.name}:`, err);
      updateItemField(item.id, 'status', 'error');
      updateItemField(item.id, 'errorMessage', err.message || 'Upload failed');
    }
  };

  // Start Batch Upload
  const handleStartBulkUpload = async () => {
    if (stagedItems.length === 0) {
      toast.warning('Please select at least one photo or video file to upload.', 'No Files Staged');
      return;
    }

    setIsUploading(true);
    let completedCount = 0;

    // Process files in sequential batches of 2 for maximum network reliability
    const concurrency = 2;
    for (let i = 0; i < stagedItems.length; i += concurrency) {
      const chunk = stagedItems.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (item) => {
          if (item.status !== 'completed') {
            await uploadSingleItem(item);
            completedCount++;
            setOverallProgress(Math.round((completedCount / stagedItems.length) * 100));
          }
        })
      );
    }

    setIsUploading(false);
    toast.success(`Bulk upload complete! Successfully processed items are live in the media library.`, 'Upload Complete');
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      stagedItems.forEach(item => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const totalPhotos = stagedItems.filter(i => i.type === 'photos').length;
  const totalVideos = stagedItems.filter(i => i.type === 'videos').length;
  const totalBytes = stagedItems.reduce((acc, curr) => acc + curr.size, 0);
  const completedItems = stagedItems.filter(i => i.status === 'completed').length;
  const failedItems = stagedItems.filter(i => i.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 flex items-center justify-between border-b border-emerald-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-white">Bulk Media Uploader</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30">
                  Photos & Videos
                </span>
              </div>
              <p className="text-emerald-200 text-xs mt-0.5">
                Batch upload high-definition pictures and match videos directly to the tournament gallery and highlights.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Top Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 shadow-sm'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.mp4,.webm,.mov,.mkv,.m4v,.jpg,.jpeg,.png,.webp,.gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">
                Drag and drop your photos & videos here, or <span className="text-emerald-700 underline">browse files</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Supports batch selection of JPEG, PNG, WebP photos and MP4, WebM, MOV match recordings. You can upload dozens of files at once!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-bold text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Images: JPG, PNG, WEBP
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-600" /> Videos: MP4, WEBM, MOV, MKV
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black">
                Unlimited Multi-File Queue
              </span>
            </div>
          </div>

          {/* Staged Items Control Bar */}
          {stagedItems.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Staged Queue: {stagedItems.length} Files</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-700">{totalPhotos} Photos</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-amber-700">{totalVideos} Videos</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">{formatBytes(totalBytes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More Files
                  </button>
                  <button
                    type="button"
                    onClick={clearAllStaged}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Queue
                  </button>
                </div>
              </div>

              {/* Batch Defaults Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-600" /> Apply Common Defaults to All Staged Files
                  </span>
                  <button
                    type="button"
                    onClick={applyBatchPresetsToAll}
                    disabled={isUploading}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    Update All Rows With Below Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">County</label>
                    <select
                      value={batchCounty}
                      onChange={(e) => setBatchCounty(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700"
                    >
                      {countiesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Edition Year</label>
                    <select
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="2025/26">2025/26 Season</option>
                      <option value="2024/25">2024/25 Championship</option>
                      <option value="2023/24">2023/24 Edition</option>
                      <option value="2022/23">2022/23 Edition</option>
                      <option value="Archive">Historical Archive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Default Tag</label>
                    <select
                      value={batchTag}
                      onChange={(e) => setBatchTag(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700"
                    >
                      {COMMON_TAGS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Stamp</label>
                    <input
                      type="text"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                      disabled={isUploading}
                      placeholder="e.g. August 2025"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staged Items List */}
          {stagedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Staged Files ({stagedItems.length})
              </h4>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {stagedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center gap-4 ${
                      item.status === 'completed'
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : item.status === 'error'
                        ? 'border-rose-400 bg-rose-50/20'
                        : item.status === 'uploading'
                        ? 'border-blue-400 bg-blue-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Media Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 flex items-center justify-center">
                      {item.type === 'videos' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={item.previewUrl}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-yellow-400 font-mono text-[9px] font-bold">
                            VIDEO
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Metadata Edit Form Fields */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                              item.type === 'videos'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {item.type === 'videos' ? 'Match Video' : 'Photo'}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">#{idx + 1}</span>
                          <span className="text-slate-500 text-xs font-mono font-medium">
                            {formatBytes(item.size)}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          {item.status === 'ready' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                              Ready
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                              Uploading ({item.progress}%)
                            </span>
                          )}
                          {item.status === 'saving' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              Saving to Database...
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Live in Gallery
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Error
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeStagedItem(item.id)}
                            disabled={isUploading && item.status === 'uploading'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Row 1: Title */}
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItemField(item.id, 'title', e.target.value)}
                        disabled={isUploading}
                        placeholder="Title for this media item"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700"
                      />

                      {/* Row 2: County, Year, Tag */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <select
                          value={item.county}
                          onChange={(e) => updateItemField(item.id, 'county', e.target.value)}
                          disabled={isUploading}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
                        >
                          {countiesList.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        <select
                          value={item.editionYear}
                          onChange={(e) => updateItemField(item.id, 'editionYear', e.target.value)}
                          disabled={isUploading}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
                        >
                          <option value="2025/26">2025/26 Season</option>
                          <option value="2024/25">2024/25 Championship</option>
                          <option value="2023/24">2023/24 Edition</option>
                          <option value="2022/23">2022/23 Edition</option>
                          <option value="Archive">Historical Archive</option>
                        </select>

                        <input
                          type="text"
                          value={item.tag}
                          onChange={(e) => updateItemField(item.id, 'tag', e.target.value)}
                          disabled={isUploading}
                          placeholder="Tag / Category"
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
                        />
                      </div>

                      {/* Progress bar per item if uploading */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {stagedItems.length === 0 ? (
              <span>Select or drop photos and videos above to begin bulk upload.</span>
            ) : isUploading ? (
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Uploading {completedItems} of {stagedItems.length} items ({overallProgress}%)...</span>
              </div>
            ) : completedItems === stagedItems.length && stagedItems.length > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All {stagedItems.length} items uploaded successfully!
              </span>
            ) : (
              <span>
                Ready to upload <strong className="text-slate-900">{stagedItems.length} files</strong> ({totalPhotos} photos, {totalVideos} videos)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              {completedItems === stagedItems.length && stagedItems.length > 0 ? 'Close & View Gallery' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleStartBulkUpload}
              disabled={isUploading || stagedItems.length === 0 || completedItems === stagedItems.length}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Uploads ({overallProgress}%)...</span>
                </>
              ) : completedItems === stagedItems.length && stagedItems.length > 0 ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>All Uploaded</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload {stagedItems.length} Media Files</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
