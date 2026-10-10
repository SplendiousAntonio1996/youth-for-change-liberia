/**
 * useGalleryMedia.ts
 * React hook that uses Firestore to persist references to gallery media items so they can
 * be re-verified or re-fetched if the local browser cache is cleared or becomes stale.
 * 
 * Features:
 * - 0ms immediate initial render from local browser cache (localStorage)
 * - Real-time Firestore sync via onSnapshot
 * - Automatic re-fetch when local browser cache is cleared or missing
 * - Automatic background re-verification when cache exceeds 24-hour staleness threshold
 * - Methods to persist, update, delete, re-verify, and force-refetch media references
 * - Repairs ephemeral /uploads/ links with permanent high-res cloud photography or YouTube thumbnails
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GalleryItem, GallerySubTab } from '../types';
import { 
  subscribeToGalleryItems, 
  refetchGalleryMedia, 
  reverifyAndRepairGalleryMedia, 
  persistMediaItemToFirestore,
  deleteMediaItemFromFirestore,
  getStoredMediaReferences,
  clearStoredMediaReferences,
  GALLERY_CACHE_KEY
} from '../lib/galleryService';
import { useToast } from '../context/ToastContext';

export type GallerySyncStatus = 'synced' | 'syncing' | 'stale' | 'offline' | 'error';

export interface UseGalleryMediaReturn {
  // Items
  mediaItems: GalleryItem[];
  allMedia: GalleryItem[];
  photos: GalleryItem[];
  videos: GalleryItem[];
  events: GalleryItem[];

  // Counts
  photosCount: number;
  videosCount: number;
  eventsCount: number;

  // Status & Timestamps
  loading: boolean;
  isVerifying: boolean;
  isStale: boolean;
  syncStatus: GallerySyncStatus;
  lastVerifiedAt: Date | null;
  error: string | null;

  // Actions
  refetch: (forceServer?: boolean) => Promise<GalleryItem[]>;
  reverify: () => Promise<{ total: number; repaired: number; items: GalleryItem[] }>;
  persistMediaItem: (item: Omit<GalleryItem, 'id'> | GalleryItem) => Promise<GalleryItem>;
  updateMediaItem: (id: string, updates: Partial<GalleryItem>) => Promise<GalleryItem>;
  deleteMediaItem: (id: string) => Promise<void>;
  clearCacheAndRefetch: () => Promise<GalleryItem[]>;
}

export function useGalleryMedia(categoryFilter?: GallerySubTab | 'all'): UseGalleryMediaReturn {
  const toast = useToast();

  // Initialize immediately from local browser cache if available for instant paint
  const initialCache = useMemo(() => getStoredMediaReferences(), []);
  
  const [items, setItems] = useState<GalleryItem[]>(initialCache.items);
  const [loading, setLoading] = useState<boolean>(initialCache.items.length === 0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(initialCache.isStale);
  const [syncStatus, setSyncStatus] = useState<GallerySyncStatus>(
    initialCache.isStale ? 'stale' : (initialCache.items.length > 0 ? 'synced' : 'syncing')
  );
  const [lastVerifiedAt, setLastVerifiedAt] = useState<Date | null>(
    initialCache.lastVerified ? new Date(initialCache.lastVerified) : null
  );
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef<boolean>(true);

  // 1. Real-time Firestore subscription
  useEffect(() => {
    setSyncStatus('syncing');
    const unsubscribe = subscribeToGalleryItems(
      (freshItems) => {
        setItems(freshItems);
        setLoading(false);
        setIsStale(false);
        setSyncStatus('synced');
        setLastVerifiedAt(new Date());
        setError(null);
      },
      (err) => {
        setError(err.message || 'Error synchronizing gallery items from Firestore');
        setLoading(false);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Re-fetches fresh references from Firestore database.
   * Invoked if local cache was cleared, expired, or to guarantee cloud consistency.
   */
  const refetch = useCallback(async (forceServer = true): Promise<GalleryItem[]> => {
    setLoading(true);
    setSyncStatus('syncing');
    setError(null);
    try {
      const fresh = await refetchGalleryMedia(forceServer);
      setItems(fresh);
      setIsStale(false);
      setSyncStatus('synced');
      setLastVerifiedAt(new Date());
      return fresh;
    } catch (err: any) {
      const msg = err.message || 'Failed to re-fetch gallery media references';
      setError(msg);
      setSyncStatus('error');
      toast.error(msg, 'Re-fetch Failed');
      return items;
    } finally {
      setLoading(false);
    }
  }, [items, toast]);

  /**
   * Re-verifies all media links against Firestore, repairs broken/ephemeral URLs,
   * updates the cloud database, and refreshes the local cache.
   */
  const reverify = useCallback(async (): Promise<{ total: number; repaired: number; items: GalleryItem[] }> => {
    setIsVerifying(true);
    setSyncStatus('syncing');
    try {
      const result = await reverifyAndRepairGalleryMedia();
      setItems(result.items);
      setIsStale(false);
      setSyncStatus('synced');
      setLastVerifiedAt(new Date());

      if (result.repaired > 0) {
        toast.success(
          `Re-verified all media references. Repaired ${result.repaired} item(s) with permanent cloud photography!`,
          'Verification Complete'
        );
      } else {
        toast.success(`All ${result.total} media references verified and 100% healthy!`, 'Media Verified');
      }

      return result;
    } catch (err: any) {
      const msg = err.message || 'Error verifying media references';
      setError(msg);
      setSyncStatus('error');
      toast.error(msg, 'Verification Error');
      return { total: items.length, repaired: 0, items };
    } finally {
      setIsVerifying(false);
    }
  }, [items, toast]);

  /**
   * Persists a media item (photo, video, event) to Firestore
   * and updates local browser storage.
   */
  const persistMediaItem = useCallback(async (
    item: Omit<GalleryItem, 'id'> | GalleryItem
  ): Promise<GalleryItem> => {
    setSyncStatus('syncing');
    try {
      const saved = await persistMediaItemToFirestore(item);
      setItems(prev => {
        const existingIdx = prev.findIndex(i => i.id === saved.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setIsStale(false);
      setSyncStatus('synced');
      setLastVerifiedAt(new Date());
      return saved;
    } catch (err: any) {
      setSyncStatus('error');
      const msg = err.message || 'Failed to persist media reference to Firestore';
      toast.error(msg, 'Persistence Failed');
      throw err;
    }
  }, [toast]);

  /**
   * Updates an existing media item in Firestore and cache
   */
  const updateMediaItem = useCallback(async (
    id: string, 
    updates: Partial<GalleryItem>
  ): Promise<GalleryItem> => {
    const existing = items.find(i => i.id === id);
    if (!existing) {
      throw new Error(`Media item with ID ${id} not found`);
    }
    const merged: GalleryItem = { ...existing, ...updates, id };
    return await persistMediaItem(merged);
  }, [items, persistMediaItem]);

  /**
   * Deletes a media item from Firestore and local cache
   */
  const deleteMediaItem = useCallback(async (id: string): Promise<void> => {
    setSyncStatus('syncing');
    try {
      await deleteMediaItemFromFirestore(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSyncStatus('synced');
      toast.success('Media reference deleted from database and local cache.', 'Deleted');
    } catch (err: any) {
      setSyncStatus('error');
      const msg = err.message || 'Failed to delete media reference';
      toast.error(msg, 'Delete Failed');
      throw err;
    }
  }, [toast]);

  /**
   * Clears the local browser cache and immediately re-hydrates fresh references
   * directly from Firestore.
   */
  const clearCacheAndRefetch = useCallback(async () => {
    clearStoredMediaReferences();
    setIsStale(true);
    setLastVerifiedAt(null);
    toast.info('Local browser media cache cleared. Re-fetching directly from Firestore...', 'Cache Cleared');
    return await refetch(true);
  }, [refetch, toast]);

  // 2. Auto-detect if browser cache is cleared or stale on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Case A: Local cache was empty/cleared -> immediately fetch from Firestore
      if (initialCache.items.length === 0) {
        refetch(true);
      } 
      // Case B: Local cache is stale (> 24 hours) -> silently re-verify in background
      else if (initialCache.isStale) {
        reverify();
      }
    }
  }, [initialCache.items.length, initialCache.isStale, refetch, reverify]);

  // 3. Storage event listener: if cache is cleared in another tab or window, auto-re-fetch
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GALLERY_CACHE_KEY) {
        if (!e.newValue) {
          // Cache was wiped -> re-fetch immediately from Firestore
          refetch(true);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setItems(parsed);
              setIsStale(false);
            }
          } catch {}
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetch]);

  // 4. Online/offline listener: re-verify when connection is regained
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      refetch(false);
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  // Derived filtered items
  const photos = useMemo(() => items.filter(i => i.category === 'photos'), [items]);
  const videos = useMemo(() => items.filter(i => i.category === 'videos'), [items]);
  const events = useMemo(() => items.filter(i => i.category === 'events'), [items]);

  const mediaItems = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') {
      return items;
    }
    return items.filter(i => i.category === categoryFilter);
  }, [items, categoryFilter]);

  return {
    mediaItems,
    allMedia: items,
    photos,
    videos,
    events,
    photosCount: photos.length,
    videosCount: videos.length,
    eventsCount: events.length,
    loading,
    isVerifying,
    isStale,
    syncStatus,
    lastVerifiedAt,
    error,
    refetch,
    reverify,
    persistMediaItem,
    updateMediaItem,
    deleteMediaItem,
    clearCacheAndRefetch
  };
}
