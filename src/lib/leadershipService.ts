import { 
  collection, 
  onSnapshot, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { LeaderMember } from '../types';
import { LEADERSHIP_TEAM } from '../data/contentData';

const LOCAL_STORAGE_KEY = 'yfc_leadership_team_cache';

// Helper to load cached leaders from localStorage
function getLocalCache(): LeaderMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading leadership local cache', e);
  }
  // Initialize with official leadership team roles if empty
  if (Array.isArray(LEADERSHIP_TEAM) && LEADERSHIP_TEAM.length > 0) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(LEADERSHIP_TEAM));
    } catch (e) {
      // ignore
    }
    return LEADERSHIP_TEAM;
  }
  return [];
}

// Helper to persist cache to localStorage
function setLocalCache(leaders: LeaderMember[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leaders));
  } catch (e) {
    console.warn('Error saving leadership local cache', e);
  }
}

// Normalize Firestore document or object to LeaderMember
export function normalizeLeader(data: any, id: string): LeaderMember {
  return {
    id,
    name: data.name || '',
    role: data.role || 'Executive Member',
    bio: data.bio || '',
    county: data.county || 'Montserrado',
    image: data.image || '',
    social: data.social || '',
    email: data.email || '',
    phone: data.phone || '',
    department: data.department || 'Executive Directorate',
    order: typeof data.order === 'number' ? data.order : 99,
    featured: data.featured ?? false,
    active: data.active ?? true,
    authorUid: data.authorUid || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * Realtime subscription to leadership team
 */
export function subscribeToLeadership(callback: (leaders: LeaderMember[]) => void): () => void {
  // First emit from local cache if any exists
  const initialCache = getLocalCache();
  callback(initialCache.length > 0 ? initialCache : LEADERSHIP_TEAM);

  let unsubFirestore = () => {};

  try {
    const leadersCol = collection(db, 'leaders');
    unsubFirestore = onSnapshot(leadersCol, (snapshot) => {
      const firestoreLeaders = snapshot.docs.map(doc => normalizeLeader(doc.data(), doc.id));
      
      if (firestoreLeaders.length > 0) {
        // Sort primarily by order, then by creation date
        firestoreLeaders.sort((a, b) => {
          const orderA = a.order ?? 99;
          const orderB = b.order ?? 99;
          if (orderA !== orderB) return orderA - orderB;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        setLocalCache(firestoreLeaders);
        callback(firestoreLeaders);
      } else {
        // Fall back to default official leadership team
        const fallback = getLocalCache();
        callback(fallback.length > 0 ? fallback : LEADERSHIP_TEAM);
      }
    }, (err) => {
      console.warn('Leadership collection subscription error:', err);
      // Fallback to cache on error
      const fallback = getLocalCache();
      callback(fallback.length > 0 ? fallback : LEADERSHIP_TEAM);
    });
  } catch (e) {
    console.warn('Could not establish leadership listener', e);
    const fallback = getLocalCache();
    callback(fallback.length > 0 ? fallback : LEADERSHIP_TEAM);
  }

  return () => {
    unsubFirestore();
  };
}

/**
 * Seed or restore official leadership roles into directory
 */
export async function seedLeadershipRoles(authorUid?: string): Promise<LeaderMember[]> {
  const seededList: LeaderMember[] = [];
  for (const leader of LEADERSHIP_TEAM) {
    try {
      const docRef = doc(db, 'leaders', leader.id);
      await setDoc(docRef, {
        ...leader,
        authorUid: authorUid || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      seededList.push(leader);
    } catch (err) {
      console.warn('Firestore setDoc failed during seeding, leader saved locally:', leader.role, err);
      seededList.push(leader);
    }
  }

  setLocalCache(seededList.length > 0 ? seededList : LEADERSHIP_TEAM);
  return seededList.length > 0 ? seededList : LEADERSHIP_TEAM;
}

/**
 * Create a new leadership profile
 */
export async function createLeader(leader: Omit<LeaderMember, 'id'>, authorUid?: string): Promise<LeaderMember> {
  const timestamp = new Date().toISOString();
  const leaderData = {
    ...leader,
    authorUid: authorUid || '',
    createdAt: timestamp,
    updatedAt: timestamp,
    active: leader.active ?? true,
    order: typeof leader.order === 'number' ? leader.order : 0
  };

  try {
    const docRef = await addDoc(collection(db, 'leaders'), leaderData);
    const newLeader: LeaderMember = {
      ...leaderData,
      id: docRef.id
    };

    // Update local cache
    const current = getLocalCache();
    const updated = [...current, newLeader];
    setLocalCache(updated);

    return newLeader;
  } catch (e) {
    console.warn('Firestore addDoc failed, persisting to local storage:', e);
    const localId = 'local_leader_' + Date.now();
    const newLeader: LeaderMember = {
      ...leaderData,
      id: localId
    };
    const current = getLocalCache();
    const updated = [...current, newLeader];
    setLocalCache(updated);
    return newLeader;
  }
}

/**
 * Update an existing leadership profile
 */
export async function updateLeader(id: string, leader: Partial<LeaderMember>): Promise<void> {
  const timestamp = new Date().toISOString();
  const updatePayload = {
    ...leader,
    updatedAt: timestamp
  };

  try {
    const docRef = doc(db, 'leaders', id);
    await updateDoc(docRef, updatePayload);
  } catch (e) {
    console.warn('Firestore updateDoc failed, updating local cache:', e);
  }

  // Update local cache
  const current = getLocalCache();
  const index = current.findIndex(l => l.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updatePayload };
    setLocalCache([...current]);
  }
}

/**
 * Delete a leadership profile
 */
export async function deleteLeader(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'leaders', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore deleteDoc failed, deleting from local cache:', e);
  }

  // Remove from local cache
  const current = getLocalCache();
  const updated = current.filter(l => l.id !== id);
  setLocalCache(updated);
}
