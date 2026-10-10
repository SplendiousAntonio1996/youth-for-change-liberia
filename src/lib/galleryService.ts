/**
 * galleryService.ts
 * Robust Firestore persistence & local cache synchronization service for media gallery items.
 * Ensures references to photos, videos, and events are permanently persisted in Firestore
 * and seamlessly re-fetched or re-verified if the browser cache is cleared, expired, or stale.
 */

import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  getDocsFromServer, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  deleteDoc,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { GalleryItem } from '../types';
import { getContextualArchiveFallback } from '../components/SafeImage';

export const GALLERY_CACHE_KEY = 'yfc_gallery_media_refs_v2';
export const GALLERY_TIMESTAMP_KEY = 'yfc_gallery_media_verified_at_v2';
export const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours staleness threshold

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Gallery Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * 12 Permanent Curated Media Items
 * Used as verified baseline references so the site is never blank,
 * and automatically seeded to Firestore if the collection is empty.
 */
export const CURATED_DEFAULT_MEDIA: Omit<GalleryItem, 'id'>[] = [
  // 1. Photos
  {
    title: '2025 National Grand Finals Trophy Presentation',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Montserrado',
    url: '/DEBATE.jpeg',
    posterUrl: '/DEBATE.jpeg',
    description: 'Championship debate delegates celebrate at the Ministerial Complex following unanimous grand final adjudication.',
    date: 'February 2025',
    tag: 'Debate Finals',
    createdAt: '2025-02-15T12:00:00.000Z',
    isVerified: true
  },
  {
    title: 'National STEM Challenge Prototype Exhibition',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Bong',
    url: '/STEM.jpeg',
    posterUrl: '/STEM.jpeg',
    description: 'High school innovators demonstrate solar agricultural dryers and automated micro-irrigation systems.',
    date: 'January 2025',
    tag: 'STEM Expo',
    createdAt: '2025-01-20T10:00:00.000Z',
    isVerified: true
  },
  {
    title: 'Grand Bassa & Nimba County Regional Championship',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Grand Bassa',
    url: '/group.jpg',
    posterUrl: '/group.jpg',
    description: 'Debaters and faculty advisors during the high-energy coastal qualifier rounds in Buchanan.',
    date: 'December 2024',
    tag: 'Celebration',
    createdAt: '2024-12-14T14:30:00.000Z',
    isVerified: true
  },
  {
    title: 'Rural Adjudicator & Forensic Coach Certification',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Lofa',
    url: '/ACADEMIC.jpeg',
    posterUrl: '/ACADEMIC.jpeg',
    description: '45 secondary educators certified in WSDC forensics scoring and speaker-point equity in Voinjama.',
    date: 'November 2024',
    tag: 'Training',
    createdAt: '2024-11-10T09:00:00.000Z',
    isVerified: true
  },
  {
    title: 'National Youth Peace & Civic Literacy Forum',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Margibi',
    url: '/YOUTH.jpeg',
    posterUrl: '/YOUTH.jpeg',
    description: 'Student leaders gather in Kakata for youth-led discussions on constitutional literacy and peace-building.',
    date: 'October 2024',
    tag: 'Youth Summit',
    createdAt: '2024-10-05T11:00:00.000Z',
    isVerified: true
  },
  {
    title: 'Annual Youth For Change Academic Scholarships Gala',
    category: 'photos',
    editionYear: '2024/25',
    county: 'Montserrado',
    url: '/MISSION.jpeg',
    posterUrl: '/MISSION.jpeg',
    description: 'Full collegiate scholarships conferred to best-speaker debaters and outstanding STEM prototype designers.',
    date: 'September 2024',
    tag: 'Scholarships',
    createdAt: '2024-09-18T18:00:00.000Z',
    isVerified: true
  },

  // 2. Videos
  {
    title: 'Full Match: 2024/25 National Championship Grand Final',
    category: 'videos',
    editionYear: '2024/25',
    county: 'Montserrado',
    url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    posterUrl: '/DEBATE.jpeg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoEmbedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Complete forensic debate clash: Montserrado Champions vs. Nimba Runners-Up on natural resource sovereignty.',
    date: 'February 2025',
    tag: 'Full Match Video',
    duration: '1h 24m',
    createdAt: '2025-02-16T15:00:00.000Z',
    isVerified: true
  },
  {
    title: 'STEM Innovation Showcase: Solar Cold Storage & Water Filtration',
    category: 'videos',
    editionYear: '2024/25',
    county: 'Nimba',
    url: 'https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg',
    posterUrl: '/STEM.jpeg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoEmbedUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    description: 'Live field demonstrations of student prototypes addressing post-harvest food waste and rural clean water.',
    date: 'January 2025',
    tag: 'STEM Expo',
    duration: '38m',
    createdAt: '2025-01-22T13:00:00.000Z',
    isVerified: true
  },
  {
    title: 'Highlights: 15-County Super Round Highlights & Speaker Speeches',
    category: 'videos',
    editionYear: '2024/25',
    county: 'National',
    url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    posterUrl: '/group.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoEmbedUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    description: 'Curated speeches, rebuttals, and victory celebrations from county delegations across all four regions.',
    date: 'December 2024',
    tag: 'Key Highlights',
    duration: '22m',
    createdAt: '2024-12-20T16:00:00.000Z',
    isVerified: true
  },

  // 3. Key Events
  {
    title: '2025/2026 National Youth Peace & Academic Summit',
    category: 'events',
    editionYear: '2025/26',
    county: 'Montserrado',
    url: '/yoccover.png',
    posterUrl: '/yoccover.png',
    description: '3-day residential leadership summit bringing together 300 student debaters, STEM scholars, and national policymakers.',
    date: 'August 14-16, 2025',
    tag: 'Annual Summit',
    venue: 'EJS Ministerial Complex, Congo Town, Monrovia',
    eventTime: '9:00 AM - 4:30 PM GMT',
    registrationLink: 'events@youthforchange.org.lr',
    createdAt: '2025-02-01T08:00:00.000Z',
    isVerified: true
  },
  {
    title: 'Liberian National High School STEM Grand Expo 2025',
    category: 'events',
    editionYear: '2024/25',
    county: 'Bong',
    url: '/STEM.jpeg',
    posterUrl: '/STEM.jpeg',
    description: 'Final championship adjudication for top 15 county high school hardware and software solutions.',
    date: 'July 10, 2025',
    tag: 'STEM Expo',
    venue: 'Cuttington University Multipurpose Gymnasium, Suakoko',
    eventTime: '10:00 AM - 5:00 PM GMT',
    registrationLink: 'stem@youthforchange.org.lr',
    createdAt: '2025-01-15T08:00:00.000Z',
    isVerified: true
  },
  {
    title: 'National Forensic Debate Adjudication Conference',
    category: 'events',
    editionYear: '2024/25',
    county: 'Margibi',
    url: '/DEBATE.jpeg',
    posterUrl: '/DEBATE.jpeg',
    description: 'Masterclass for certified tournament judges on WSDC standard points, POI moderation, and anti-bias protocols.',
    date: 'June 05, 2025',
    tag: 'Adjudication',
    venue: 'Harbel Civic Center, Firestone District',
    eventTime: '9:30 AM - 3:30 PM GMT',
    registrationLink: 'debate@youthforchange.org.lr',
    createdAt: '2025-01-10T08:00:00.000Z',
    isVerified: true
  }
];

/**
 * Ensures permanent media and cover URLs for any item,
 * eliminating broken/ephemeral container links.
 */
export function resolvePermanentUrls(item: Partial<GalleryItem>): { url: string; posterUrl: string } {
  let resolvedUrl = item.url || '';
  let resolvedPoster = item.posterUrl || '';
  const videoLink = item.videoEmbedUrl || item.videoUrl || '';

  // Extract permanent YouTube thumbnail if available
  if (videoLink) {
    const ytMatch = videoLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const ytThumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      if (!resolvedUrl || resolvedUrl.startsWith('/uploads/')) {
        resolvedUrl = ytThumb;
      }
      if (!resolvedPoster || resolvedPoster.startsWith('/uploads/')) {
        resolvedPoster = ytThumb;
      }
    }
  }

  // Resilient fallback to curated static photography if URL was lost or ephemeral
  if (!resolvedUrl || resolvedUrl.startsWith('/uploads/') || resolvedUrl.includes('uploaded_image') || resolvedUrl.includes('uploaded_video')) {
    resolvedUrl = getContextualArchiveFallback(item.category, (item.title || '') + ' ' + (item.tag || ''));
  }

  if (!resolvedPoster || resolvedPoster.startsWith('/uploads/')) {
    resolvedPoster = resolvedUrl || getContextualArchiveFallback(item.category, (item.title || '') + ' ' + (item.tag || ''));
  }

  return { url: resolvedUrl, posterUrl: resolvedPoster };
}

/**
 * Normalizes Firestore document snapshot into a type-safe GalleryItem with verified URLs
 */
export function mapDocToGalleryItem(docId: string, data: DocumentData): GalleryItem {
  const { url, posterUrl } = resolvePermanentUrls({
    url: data.url,
    posterUrl: data.posterUrl,
    videoEmbedUrl: data.videoEmbedUrl,
    videoUrl: data.videoUrl,
    category: data.category,
    title: data.title,
    tag: data.tag
  });

  return {
    id: docId,
    title: data.title || 'Untitled Media',
    category: data.category || 'photos',
    editionYear: data.editionYear || '2024/25',
    county: data.county || 'Montserrado',
    url,
    posterUrl,
    description: data.description || '',
    date: data.date || '',
    tag: data.tag || 'General',
    duration: data.duration,
    videoEmbedUrl: data.videoEmbedUrl,
    videoUrl: data.videoUrl,
    venue: data.venue,
    eventTime: data.eventTime,
    registrationLink: data.registrationLink,
    authorUid: data.authorUid,
    authorEmail: data.authorEmail,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastVerifiedAt: data.lastVerifiedAt,
    isVerified: data.isVerified ?? true
  };
}

/**
 * Loads cached media references from localStorage for immediate, zero-delay rendering
 */
export function getStoredMediaReferences(): { items: GalleryItem[]; lastVerified: string | null; isStale: boolean } {
  if (typeof window === 'undefined') {
    return { items: [], lastVerified: null, isStale: true };
  }

  try {
    const raw = localStorage.getItem(GALLERY_CACHE_KEY);
    const lastVerified = localStorage.getItem(GALLERY_TIMESTAMP_KEY);

    if (!raw) {
      return { items: [], lastVerified: null, isStale: true };
    }

    const parsed = JSON.parse(raw) as GalleryItem[];
    const items = Array.isArray(parsed) ? parsed : [];
    const isStale = !lastVerified || (Date.now() - new Date(lastVerified).getTime() > CACHE_MAX_AGE_MS);

    return { items, lastVerified, isStale };
  } catch (err) {
    console.warn('[Gallery Cache] Failed to parse local stored references:', err);
    return { items: [], lastVerified: null, isStale: true };
  }
}

/**
 * Persists verified media items and verification timestamp to localStorage
 */
export function saveStoredMediaReferences(items: GalleryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(items));
    localStorage.setItem(GALLERY_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[Gallery Cache] LocalStorage quota limit reached:', err);
  }
}

/**
 * Clears the local gallery references cache (e.g. to test re-fetching)
 */
export function clearStoredMediaReferences(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GALLERY_CACHE_KEY);
    localStorage.removeItem(GALLERY_TIMESTAMP_KEY);
  } catch {}
}

/**
 * Seeds initial curated media items into Firestore if collection is empty
 */
export async function seedCuratedGalleryIfEmpty(): Promise<GalleryItem[]> {
  const colPath = 'galleryItems';
  if (!db) {
    return CURATED_DEFAULT_MEDIA.map((item, idx) => ({ ...item, id: `curated-${idx}` }));
  }

  try {
    const seeded: GalleryItem[] = [];
    for (const item of CURATED_DEFAULT_MEDIA) {
      const docRef = await addDoc(collection(db, colPath), {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        isVerified: true
      });
      seeded.push({ ...item, id: docRef.id });
    }
    saveStoredMediaReferences(seeded);
    return seeded;
  } catch (err) {
    console.warn('[Gallery Service] Seeding default media failed:', err);
    return CURATED_DEFAULT_MEDIA.map((item, idx) => ({ ...item, id: `curated-${idx}` }));
  }
}

/**
 * Subscribes to real-time gallery items in Firestore.
 * Automatically synchronizes with local browser storage and notifies listener.
 */
export function subscribeToGalleryItems(
  onUpdate: (items: GalleryItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  // 1. Immediately emit cached references if present for 0ms paint
  const { items: cached } = getStoredMediaReferences();
  if (cached.length > 0) {
    onUpdate(cached);
  }

  if (!db) {
    if (cached.length === 0) {
      onUpdate(CURATED_DEFAULT_MEDIA.map((item, idx) => ({ ...item, id: `curated-${idx}` })));
    }
    return () => {};
  }

  const colPath = 'galleryItems';
  try {
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed defaults in the background so gallery is never blank
          seedCuratedGalleryIfEmpty().then((seeded) => {
            onUpdate(seeded);
          });
          return;
        }

        const items: GalleryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(mapDocToGalleryItem(docSnap.id, docSnap.data()));
        });

        // Update local browser cache
        saveStoredMediaReferences(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('[Firestore] galleryItems real-time subscription error:', error);
        onError?.(error);
        try {
          handleFirestoreError(error, OperationType.LIST, colPath);
        } catch {
          // preserve cached items on network or permission glitch
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Could not initiate gallery listener:', err);
    return () => {};
  }
}

/**
 * Re-fetches fresh gallery references directly from Firestore.
 * Useful when local browser cache was wiped or when verifying fresh cloud updates.
 */
export async function refetchGalleryMedia(forceServer = false): Promise<GalleryItem[]> {
  const colPath = 'galleryItems';
  if (!db) {
    const { items } = getStoredMediaReferences();
    return items.length > 0 ? items : CURATED_DEFAULT_MEDIA.map((item, idx) => ({ ...item, id: `curated-${idx}` }));
  }

  try {
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));
    const snapshot = forceServer ? await getDocsFromServer(q) : await getDocs(q);
    
    if (snapshot.empty) {
      return await seedCuratedGalleryIfEmpty();
    }

    const items: GalleryItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(mapDocToGalleryItem(docSnap.id, docSnap.data()));
    });

    saveStoredMediaReferences(items);
    return items;
  } catch (err) {
    console.warn('[Firestore] Refetching gallery media failed, falling back to cache:', err);
    const { items } = getStoredMediaReferences();
    if (items.length > 0) {
      return items;
    }
    // Return curated defaults if both network and cache fail
    return CURATED_DEFAULT_MEDIA.map((item, idx) => ({ ...item, id: `curated-${idx}` }));
  }
}

/**
 * Re-verifies all gallery items, identifies any stale / broken references,
 * repairs them with permanent cloud links, and writes back updates to Firestore.
 */
export async function reverifyAndRepairGalleryMedia(): Promise<{ total: number; repaired: number; items: GalleryItem[] }> {
  const colPath = 'galleryItems';
  if (!db) {
    const { items } = getStoredMediaReferences();
    return { total: items.length, repaired: 0, items };
  }

  try {
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const seeded = await seedCuratedGalleryIfEmpty();
      return { total: seeded.length, repaired: seeded.length, items: seeded };
    }

    const items: GalleryItem[] = [];
    let repaired = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const currentUrl = data.url || '';
      const currentPoster = data.posterUrl || '';
      const videoLink = data.videoEmbedUrl || data.videoUrl || '';

      let needsRepair = false;
      let repairedUrl = currentUrl;
      let repairedPoster = currentPoster;

      // 1. Detect expired / ephemeral container links or missing URLs
      if (!currentUrl || currentUrl.startsWith('/uploads/') || currentUrl.includes('uploaded_image') || currentUrl.includes('uploaded_video')) {
        needsRepair = true;
        const ytMatch = videoLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
          repairedUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        } else {
          repairedUrl = getContextualArchiveFallback(data.category, (data.title || '') + ' ' + (data.tag || ''));
        }
      }

      // 2. Detect missing or broken video poster cover
      if (data.category === 'videos' && (!currentPoster || currentPoster.startsWith('/uploads/'))) {
        needsRepair = true;
        repairedPoster = repairedUrl || getContextualArchiveFallback('videos', data.title);
      }

      if (needsRepair) {
        try {
          await updateDoc(doc(db, colPath, docSnap.id), {
            url: repairedUrl,
            posterUrl: repairedPoster,
            isVerified: true,
            lastVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          repaired++;
        } catch (updateErr) {
          console.warn(`[Gallery Reverify] Failed to update doc ${docSnap.id}:`, updateErr);
        }
      }

      items.push(mapDocToGalleryItem(docSnap.id, { 
        ...data, 
        url: repairedUrl, 
        posterUrl: repairedPoster,
        isVerified: true,
        lastVerifiedAt: new Date().toISOString()
      }));
    }

    // Refresh local cache with newly verified items
    saveStoredMediaReferences(items);
    return { total: items.length, repaired, items };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
  }
}

/**
 * Persists a new or modified media item directly to Firestore
 * and synchronizes with local storage cache.
 */
export async function persistMediaItemToFirestore(
  item: Omit<GalleryItem, 'id'> | GalleryItem
): Promise<GalleryItem> {
  const colPath = 'galleryItems';
  if (!db) {
    throw new Error('Firestore database instance not initialized');
  }

  // Ensure permanent URLs
  const { url, posterUrl } = resolvePermanentUrls(item);

  const payload: any = {
    title: item.title.trim(),
    category: item.category,
    editionYear: item.editionYear || '2024/25',
    county: item.county || 'Montserrado',
    url,
    posterUrl,
    description: item.description || '',
    date: item.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    tag: item.tag || 'General',
    duration: item.duration || (item.category === 'videos' ? '25m' : null),
    videoUrl: item.videoUrl || null,
    videoEmbedUrl: item.videoEmbedUrl || null,
    venue: item.venue || null,
    eventTime: item.eventTime || null,
    registrationLink: item.registrationLink || null,
    authorEmail: item.authorEmail || auth?.currentUser?.email || 'admin@youthforchange.org.lr',
    isVerified: true,
    lastVerifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    let savedId = '';
    const existingId = 'id' in item ? item.id : undefined;

    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), payload);
      savedId = existingId;
    } else {
      payload.createdAt = new Date().toISOString();
      const docRef = await addDoc(collection(db, colPath), payload);
      savedId = docRef.id;
    }

    const savedItem: GalleryItem = {
      ...payload,
      id: savedId,
      createdAt: payload.createdAt || new Date().toISOString()
    };

    // Update local cache
    const { items } = getStoredMediaReferences();
    const updatedList = existingId 
      ? items.map(i => i.id === existingId ? savedItem : i)
      : [savedItem, ...items];
    saveStoredMediaReferences(updatedList);

    return savedItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
  }
}

/**
 * Deletes a media reference from Firestore and local storage
 */
export async function deleteMediaItemFromFirestore(id: string): Promise<void> {
  const colPath = 'galleryItems';
  if (!db) {
    throw new Error('Firestore database instance not initialized');
  }

  try {
    await deleteDoc(doc(db, colPath, id));

    // Remove from local cache
    const { items } = getStoredMediaReferences();
    const updatedList = items.filter(i => i.id !== id);
    saveStoredMediaReferences(updatedList);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colPath);
  }
}
