import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { DebateEdition } from '../types';
import { DEBATE_EDITIONS as DEFAULT_DEBATE_EDITIONS } from '../data/debateData';
import { getCachedDebateEditions } from './offlineArchiveCache';

const COLLECTION_NAME = 'debateEditions';

// Normalize edition year to consistent lookup key
export function normalizeEditionKey(year: string): string {
  const clean = year.trim().toLowerCase();
  if (clean.includes('2024') && clean.includes('2025')) return '2024-25';
  if (clean === '2024/2025' || clean === '2024/25' || clean === '2024-2025') return '2024-25';
  return clean.replace(/[^a-z0-9_-]/g, '');
}

/**
 * Subscribe to real-time updates from Firestore for debate editions.
 * If Firestore has records, it combines them with baseline records.
 */
export function subscribeToDebateEditions(
  callback: (editionsMap: Record<string, DebateEdition>, editionsList: DebateEdition[]) => void
) {
  // Start with default baseline or cached editions immediately
  const cached = getCachedDebateEditions();
  const initialMap: Record<string, DebateEdition> = { ...DEFAULT_DEBATE_EDITIONS, ...cached };
  const initialList = Object.values(initialMap)
    .filter((ed, index, self) => index === self.findIndex(t => t.year === ed.year))
    .sort((a, b) => {
      const numA = parseInt(a.year.substring(0, 4)) || 0;
      const numB = parseInt(b.year.substring(0, 4)) || 0;
      return numB - numA;
    });
  callback(initialMap, initialList);

  try {
    if (!db) {
      return () => {};
    }

    const colRef = collection(db, COLLECTION_NAME);

    return onSnapshot(colRef, (snapshot) => {
      // Start with a clone of default baseline editions
      const mergedMap: Record<string, DebateEdition> = { ...DEFAULT_DEBATE_EDITIONS };

      if (!snapshot.empty) {
        // Overlay Firestore documents
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const editionId = docSnap.id;
          const year = data.year || editionId;
          const key = normalizeEditionKey(year);

          const edition: DebateEdition = {
            id: editionId,
            year: year,
            title: data.title || `${year} National Debate Championship`,
            tagline: data.tagline || '',
            theme: data.theme || '',
            championSchool: data.championSchool || 'TBD',
            championCounty: data.championCounty || 'Montserrado',
            runnerUpSchool: data.runnerUpSchool || 'TBD',
            runnerUpCounty: data.runnerUpCounty || 'Montserrado',
            bestSpeaker: data.bestSpeaker || 'TBD',
            bestSpeakerSchool: data.bestSpeakerSchool || 'TBD',
            totalSchools: typeof data.totalSchools === 'number' ? data.totalSchools : parseInt(data.totalSchools) || 0,
            totalCounties: typeof data.totalCounties === 'number' ? data.totalCounties : parseInt(data.totalCounties) || 0,
            finalMotion: data.finalMotion || '',
            finalScore: data.finalScore || 'Pending Final',
            keyHighlights: Array.isArray(data.keyHighlights) ? data.keyHighlights : [],
            summary: data.summary || '',
            image: data.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
            semiFinalists: Array.isArray(data.semiFinalists) ? data.semiFinalists : [],
            notableMotions: Array.isArray(data.notableMotions) ? data.notableMotions : [],
            status: data.status || 'Completed',
            authorUid: data.authorUid,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt
          };

          mergedMap[key] = edition;
          if (key !== year) {
            mergedMap[year] = edition;
          }
        });
      }

      // Sort list chronologically descending
      const list = Object.values(mergedMap)
        // Deduplicate by year/title
        .filter((ed, index, self) => index === self.findIndex(t => t.year === ed.year))
        .sort((a, b) => {
          const numA = parseInt(a.year.substring(0, 4)) || 0;
          const numB = parseInt(b.year.substring(0, 4)) || 0;
          return numB - numA;
        });

      callback(mergedMap, list);
    }, (error) => {
      console.warn('Firestore debateEditions sync warning, falling back to cached static archive:', error);
      const cached = getCachedDebateEditions();
      const list = Object.values(cached)
        .filter((ed, index, self) => index === self.findIndex(t => t.year === ed.year))
        .sort((a, b) => {
          const numA = parseInt(a.year.substring(0, 4)) || 0;
          const numB = parseInt(b.year.substring(0, 4)) || 0;
          return numB - numA;
        });
      callback(cached, list);
    });
  } catch (err) {
    console.warn('[debateService] Could not establish Firestore listener, using static defaults:', err);
    return () => {};
  }
}

/**
 * Create a new tournament edition in Firestore.
 */
export async function createDebateEdition(
  editionData: Omit<DebateEdition, 'id'>,
  authorUid?: string
): Promise<string> {
  const docKey = normalizeEditionKey(editionData.year) || `edition-${Date.now()}`;
  const docRef = doc(db, COLLECTION_NAME, docKey);

  const payload: Record<string, any> = {
    year: editionData.year.trim(),
    title: editionData.title.trim(),
    tagline: editionData.tagline || '',
    theme: editionData.theme || '',
    championSchool: editionData.championSchool || '',
    championCounty: editionData.championCounty || 'Montserrado',
    runnerUpSchool: editionData.runnerUpSchool || '',
    runnerUpCounty: editionData.runnerUpCounty || 'Montserrado',
    bestSpeaker: editionData.bestSpeaker || '',
    bestSpeakerSchool: editionData.bestSpeakerSchool || '',
    totalSchools: Number(editionData.totalSchools) || 0,
    totalCounties: Number(editionData.totalCounties) || 0,
    finalMotion: editionData.finalMotion || '',
    finalScore: editionData.finalScore || '',
    keyHighlights: editionData.keyHighlights || [],
    summary: editionData.summary || '',
    image: editionData.image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: editionData.semiFinalists || [],
    notableMotions: editionData.notableMotions || [],
    status: editionData.status || 'Completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (authorUid) {
    payload.authorUid = authorUid;
  }

  await setDoc(docRef, payload, { merge: true });
  return docKey;
}

/**
 * Update an existing tournament edition in Firestore.
 */
export async function updateDebateEdition(
  editionIdOrYear: string,
  editionData: Partial<DebateEdition>
): Promise<void> {
  const docKey = normalizeEditionKey(editionIdOrYear);
  const docRef = doc(db, COLLECTION_NAME, docKey);

  const payload: Record<string, any> = {
    ...editionData,
    updatedAt: new Date().toISOString()
  };

  delete payload.id; // Avoid storing id field inside document

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete a tournament edition from Firestore.
 */
export async function deleteDebateEdition(editionIdOrYear: string): Promise<void> {
  const docKey = normalizeEditionKey(editionIdOrYear);
  const docRef = doc(db, COLLECTION_NAME, docKey);
  await deleteDoc(docRef);
}

/**
 * Seed all default 10 debate editions into Firestore for full cloud editing capability.
 */
export async function seedDefaultDebateEditions(authorUid?: string): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const [key, ed] of Object.entries(DEFAULT_DEBATE_EDITIONS)) {
    const docKey = normalizeEditionKey(ed.year || key);
    const docRef = doc(db, COLLECTION_NAME, docKey);
    
    batch.set(docRef, {
      ...ed,
      status: 'Completed',
      authorUid: authorUid || 'national-secretariat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    count++;
  }

  await batch.commit();
  return count;
}
