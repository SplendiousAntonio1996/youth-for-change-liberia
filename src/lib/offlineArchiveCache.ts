import { DebateEdition } from '../types';
import { DEBATE_EDITIONS } from '../data/debateData';
import { STEM_PREVIOUS_EDITIONS } from '../data/stemData';
import { CHAMPIONSHIP_CALENDAR_2024_25 } from '../data/debateCalendarData';

const ARCHIVE_CACHE_KEY = 'yfc_static_archives_v1';
const ARCHIVE_TIMESTAMP_KEY = 'yfc_static_archives_cached_at';

export interface OfflineArchiveStatus {
  isServiceWorkerRegistered: boolean;
  isArchiveCached: boolean;
  cachedEditionsCount: number;
  lastCachedDate: string | null;
  cachedDebateYears: string[];
  cachedStemYears: string[];
}

/**
 * Automatically register the Service Worker with Workbox auto-update
 */
export function initServiceWorker(onNeedRefresh?: () => void, onOfflineReady?: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Always prime local offline archive snapshot in storage immediately
  primeStaticArchiveStorage();

  // Only register Service Worker when supported and in production builds
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return () => {};
  }

  try {
    // Dynamic import to prevent any development / bundling resolution issues
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[YFC Service Worker] New static archive version available.');
          onNeedRefresh?.();
        },
        onOfflineReady() {
          console.log('[YFC Service Worker] Static archives (2015-2025) are now cached offline.');
          onOfflineReady?.();
        },
        onRegisterError(error) {
          console.warn('[YFC Service Worker] SW registration warning:', error);
        }
      });
    }).catch(err => {
      console.warn('[YFC Service Worker] SW registration skipped:', err);
    });

    return () => {};
  } catch (err) {
    console.warn('[YFC Service Worker] Initialization warning:', err);
    return () => {};
  }
}

/**
 * Prime client-side storage with full 2015-2025 static archive data snapshot
 */
export function primeStaticArchiveStorage() {
  try {
    const archivePayload = {
      version: '1.0.0',
      debateEditions: DEBATE_EDITIONS,
      stemEditions: STEM_PREVIOUS_EDITIONS,
      calendar2024_25: CHAMPIONSHIP_CALENDAR_2024_25,
      cachedAt: new Date().toISOString()
    };

    localStorage.setItem(ARCHIVE_CACHE_KEY, JSON.stringify(archivePayload));
    localStorage.setItem(ARCHIVE_TIMESTAMP_KEY, new Date().toISOString());
    console.log('[YFC Offline Archive] 2015-2025 static debate and STEM archives saved to offline store.');
  } catch (e) {
    console.warn('[YFC Offline Archive] Local snapshot storage quota warning:', e);
  }
}

/**
 * Check whether offline static archives are safely stored
 */
export function getOfflineArchiveStatus(): OfflineArchiveStatus {
  const isSW = typeof window !== 'undefined' && 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  let isCached = false;
  let cachedDate: string | null = null;
  const debateYears = Object.keys(DEBATE_EDITIONS);
  const stemYears = STEM_PREVIOUS_EDITIONS.map(s => s.year);

  try {
    const raw = localStorage.getItem(ARCHIVE_CACHE_KEY);
    if (raw) {
      isCached = true;
      cachedDate = localStorage.getItem(ARCHIVE_TIMESTAMP_KEY);
    }
  } catch {
    // ignore
  }

  return {
    isServiceWorkerRegistered: isSW,
    isArchiveCached: isCached,
    cachedEditionsCount: debateYears.length,
    lastCachedDate: cachedDate,
    cachedDebateYears: debateYears,
    cachedStemYears: stemYears
  };
}

/**
 * Retrieve cached debate editions from offline storage
 */
export function getCachedDebateEditions(): Record<string, DebateEdition> {
  try {
    const raw = localStorage.getItem(ARCHIVE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.debateEditions) {
        return parsed.debateEditions as Record<string, DebateEdition>;
      }
    }
  } catch (e) {
    console.warn('[YFC Offline Archive] Error parsing offline archive:', e);
  }
  return DEBATE_EDITIONS;
}
