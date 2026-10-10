import { storeVideoBlob } from './mediaStorage';

/**
 * videoUtils.ts
 * High-performance client-side video file processing, metadata extraction,
 * auto-thumbnail generation, and direct binary streaming upload.
 */

export interface ProcessedVideoResult {
  dataUrl: string; // Clean lightweight server URL (e.g. /uploads/videos/vid_123.mp4)
  serverUrl: string; // Server URL for streaming playback
  name: string;
  size: number;
  durationFormatted: string;
  durationSeconds: number;
  width: number;
  height: number;
  autoPosterDataUrl?: string;
}

/**
 * Uploads a raw video or image File binary directly to the backend /api/upload-binary
 * Returns the lightweight server URL (e.g., /uploads/videos/vid_1725100000_match.mp4)
 * Supports progress tracking for large multi-hundred-megabyte and gigabyte video files.
 */
export async function uploadVideoBinary(
  file: File,
  type: 'video' | 'image' = 'video',
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<{ success: boolean; url: string; size: number }> {
  return new Promise((resolve, reject) => {
    try {
      const queryParams = new URLSearchParams({
        filename: file.name,
        type
      });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/upload-binary?${queryParams.toString()}`, true);
      xhr.setRequestHeader('Content-Type', file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'));

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent, event.loaded, event.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              url: data.url,
              size: data.size || file.size
            });
          } catch (jsonErr) {
            resolve({
              success: true,
              url: `/uploads/${type === 'video' ? 'videos' : 'images'}/${file.name}`,
              size: file.size
            });
          }
        } else {
          let errMsg = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error) errMsg = parsed.error;
          } catch {}
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during media binary upload.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload connection timed out.'));
      };

      xhr.send(file);
    } catch (err: any) {
      console.error('Failed to stream video to server:', err);
      reject(err);
    }
  });
}

/**
 * Uploads a base64 Data URL or file binary to the local backend /api/upload-media
 * Returns the lightweight server URL (e.g., /uploads/videos/vid_1725100000.mp4)
 */
export async function uploadMediaToServer(
  dataUrl: string,
  fileName?: string,
  type: 'video' | 'image' = 'video'
): Promise<{ success: boolean; url: string; size: number }> {
  try {
    const res = await fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        filename: fileName || (type === 'video' ? 'uploaded_video.mp4' : 'uploaded_image.jpg'),
        name: fileName,
        type
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      url: data.url,
      size: data.size
    };
  } catch (err: any) {
    console.error('Failed to upload media to server:', err);
    throw err;
  }
}

/**
 * Formats seconds into a human-readable duration like '1h 24m' or '3m 45s'
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m${secs > 0 ? ` ${secs}s` : ''}`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Formats file size in bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Reads a local video file from user's computer, loads video metadata via Blob URL,
 * extracts a poster snapshot frame, stores locally in IndexedDB, and uploads to server.
 */
export async function processVideoFile(
  file: File,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<ProcessedVideoResult> {
  return new Promise(async (resolve, reject) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v|mkv)$/i)) {
      return reject(new Error('Please select a valid video file (.mp4, .webm, .mov, etc.)'));
    }

    // Store in IndexedDB for instant zero-latency playback
    let persistentBlobUrl: string = '';
    try {
      persistentBlobUrl = await storeVideoBlob(file.name, file);
    } catch (e) {
      console.warn('Could not store in IndexedDB:', e);
    }

    // Start direct binary upload in parallel with progress tracking
    const uploadPromise = uploadVideoBinary(file, 'video', onProgress);

    // Create object URL for instant video metadata parsing and canvas poster capture
    const blobUrl = persistentBlobUrl || URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = blobUrl;

    let autoPosterDataUrl: string | undefined;
    let durationSec = 0;
    let width = 1280;
    let height = 720;

    video.onloadedmetadata = () => {
      durationSec = video.duration || 0;
      width = video.videoWidth || 1280;
      height = video.videoHeight || 720;

      // Seek to capture poster frame
      const seekTime = Math.min(1.0, durationSec * 0.1);
      video.currentTime = seekTime;

      video.onseeked = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 720);
          canvas.height = Math.round((canvas.width * height) / width);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            autoPosterDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          }
        } catch (err) {
          console.warn('Could not extract video auto-thumbnail frame:', err);
        }

        try {
          const uploadRes = await uploadPromise;
          // Also index under the server URL in IndexedDB
          try {
            await storeVideoBlob(uploadRes.url, file);
          } catch (e) {}

          resolve({
            dataUrl: uploadRes.url,
            serverUrl: uploadRes.url,
            name: file.name,
            size: file.size,
            durationFormatted: formatDuration(durationSec),
            durationSeconds: durationSec,
            width,
            height,
            autoPosterDataUrl
          });
        } catch (uploadErr: any) {
          console.warn('Server storage upload skipped, resolving with local cached copy:', uploadErr);
          // Even if server upload has an issue, provide the local file URL so user can preview and play immediately
          resolve({
            dataUrl: blobUrl,
            serverUrl: blobUrl,
            name: file.name,
            size: file.size,
            durationFormatted: formatDuration(durationSec),
            durationSeconds: durationSec,
            width,
            height,
            autoPosterDataUrl
          });
        }
      };
    };

    video.onerror = async () => {
      try {
        const uploadRes = await uploadPromise;
        try {
          await storeVideoBlob(uploadRes.url, file);
        } catch (e) {}
        resolve({
          dataUrl: uploadRes.url,
          serverUrl: uploadRes.url,
          name: file.name,
          size: file.size,
          durationFormatted: 'Recorded Match',
          durationSeconds: 0,
          width: 1280,
          height: 720,
          autoPosterDataUrl: undefined
        });
      } catch (uploadErr: any) {
        resolve({
          dataUrl: blobUrl,
          serverUrl: blobUrl,
          name: file.name,
          size: file.size,
          durationFormatted: 'Recorded Match',
          durationSeconds: 0,
          width: 1280,
          height: 720,
          autoPosterDataUrl: undefined
        });
      }
    };
  });
}
