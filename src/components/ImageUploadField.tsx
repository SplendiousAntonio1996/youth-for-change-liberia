import React, { useState, useRef, DragEvent } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Check, 
  Link as LinkIcon, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { optimizeImageFile, formatBytes } from '../lib/imageUtils';
import { useToast } from '../context/ToastContext';

export interface ImagePreset {
  label: string;
  url: string;
  category?: string;
}

export interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'banner' | 'auto';
  presets?: ImagePreset[];
  allowUrlInput?: boolean;
  defaultMode?: 'file' | 'url';
  maxDimensions?: { maxWidth?: number; maxHeight?: number };
  className?: string;
  id?: string;
  defaultFit?: 'contain' | 'cover-top' | 'cover';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = 'Upload Picture',
  helperText,
  required = false,
  aspectRatio = 'auto',
  presets = [],
  allowUrlInput = true,
  defaultMode = 'file',
  maxDimensions = { maxWidth: 1600, maxHeight: 1200 },
  className = '',
  id,
  defaultFit = 'contain'
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'file' | 'url'>(
    value && value.startsWith('http') && !value.startsWith('data:') ? 'url' : defaultMode
  );
  const [previewFit, setPreviewFit] = useState<'contain' | 'cover-top' | 'cover'>(defaultFit);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    originalSize?: number;
    optimizedSize?: number;
    name?: string;
    width?: number;
    height?: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square max-w-[220px]',
    portrait: 'aspect-[3/4] max-w-[240px]',
    banner: 'min-h-[200px] max-h-[340px] aspect-[16/9] sm:aspect-[21/9]',
    auto: 'min-h-[180px] max-h-[340px]'
  }[aspectRatio];

  const fitClasses = {
    contain: 'object-contain',
    'cover-top': 'object-cover object-top',
    cover: 'object-cover object-center'
  }[previewFit];

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, GIF, SVG).');
      toast.error('Please select an image file (JPG, PNG, WebP, etc.)', 'Invalid File Type');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size is too large (> 25MB). Please choose a smaller image.');
      toast.warning('Selected image exceeds 25MB limit.', 'File Too Large');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const result = await optimizeImageFile(file, {
        maxWidth: maxDimensions.maxWidth || 1400,
        maxHeight: maxDimensions.maxHeight || 1000,
        quality: 0.85
      });

      onChange(result.dataUrl);
      setUploadStats({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        name: result.name,
        width: result.width,
        height: result.height
      });

      toast.success(
        `Uploaded "${file.name}" (${formatBytes(result.originalSize)} -> ${formatBytes(result.optimizedSize)})`,
        'Picture Ready'
      );
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMsg('Failed to process image. Please try another picture.');
      toast.error('Could not process this image file.', 'Upload Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so re-selecting the same file works
    if (e.target) {
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClearImage = () => {
    onChange('');
    setUploadStats(null);
    setErrorMsg(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Field Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {allowUrlInput && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                inputMode === 'file'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-3 h-3" />
              <span>From Computer</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                inputMode === 'url'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Paste Link</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
        id={id ? `${id}-native-file` : undefined}
      />

      {/* ACTIVE PREVIEW STATE */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs transition-all">
          <div className={`w-full ${aspectClasses} relative overflow-hidden bg-slate-950 flex items-center justify-center p-1`}>
            <img
              src={value}
              alt="Selected upload preview"
              className={`w-full h-full ${fitClasses} transition-all`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80';
              }}
            />

            {/* Overlay Action Bar */}
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold bg-emerald-600/95 backdrop-blur-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  <FileCheck className="w-3.5 h-3.5" />
                  {value.startsWith('data:') ? 'Computer Upload (Preserved)' : 'Image Preview'}
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 justify-between items-center">
                {/* Fit Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPreviewFit('contain')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      previewFit === 'contain' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Shows entire photo with no head cropping"
                  >
                    Full Photo (No Crop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFit('cover-top')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      previewFit === 'cover-top' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Fills frame while keeping heads visible at top"
                  >
                    Top-Aligned (Heads Visible)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/95 hover:bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Replace Picture</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Info / Compression Badge */}
          {uploadStats && (
            <div className="px-3.5 py-2 bg-emerald-50/80 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
              <span className="font-semibold truncate max-w-[200px]">
                {uploadStats.name || 'Local Picture'}
              </span>
              <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-700">
                {uploadStats.width && uploadStats.height && (
                  <span>{uploadStats.width}×{uploadStats.height}px</span>
                )}
                {uploadStats.originalSize && uploadStats.optimizedSize && (
                  <span className="bg-emerald-200/70 px-1.5 py-0.5 rounded font-bold">
                    {formatBytes(uploadStats.optimizedSize)} (saved {Math.round((1 - uploadStats.optimizedSize / uploadStats.originalSize) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NO IMAGE SELECTED / UPLOAD DROPZONE */
        <div>
          {inputMode === 'file' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30'
              }`}
            >
              {isProcessing ? (
                <div className="py-4 space-y-2">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-emerald-800">Optimizing picture from your computer...</p>
                  <p className="text-[10px] text-slate-500">Auto-compressing for ultra-fast loading</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose picture from your computer
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      or drag and drop your photo here (JPG, PNG, WebP, SVG)
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-emerald-700 shadow-2xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Browse Files</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL INPUT BOX */
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Tip: You can paste any direct web image URL, or switch to <strong>From Computer</strong> above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ERROR MESSAGE IF ANY */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PRESET GALLERY (IF PROVIDED) */}
      {presets.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Or pick a curated sample photo:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => onChange(preset.url)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  value === preset.url
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {value === preset.url && <Check className="w-2.5 h-2.5 text-emerald-300" />}
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HELPER TEXT */}
      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
