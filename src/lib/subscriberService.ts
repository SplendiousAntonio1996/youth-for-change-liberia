import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SubscriberItem } from '../types';

export const SUBSCRIBERS_STORAGE_KEY = 'yfc_newsletter_subscribers';
export const SUBSCRIBERS_UPDATED_EVENT = 'yfc_subscribers_updated';

// Error handling conforming to Firebase skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error in SubscriberService: ', JSON.stringify(errInfo));
  // We log and return rather than crashing client-side subscriptions
  return errInfo;
}

// Preloaded mock subscribers reflecting real Liberian schools, institutions, and youth desks
export const INITIAL_MOCK_SUBSCRIBERS: SubscriberItem[] = [
  {
    id: 'mock-sub-1',
    email: 'debate.coach@stteresa.edu.lr',
    category: 'Debate & Oratory',
    subscribedAt: '2025-02-18 09:30',
    source: 'Footer Newsletter',
    status: 'active',
    county: 'Montserrado',
    isMock: true,
    notes: 'St. Teresa Convent High School debate coordinator & adjudicator'
  },
  {
    id: 'mock-sub-2',
    email: 'stem.lead@jjroberts.edu.lr',
    category: 'STEM & Robotics',
    subscribedAt: '2025-02-19 14:15',
    source: 'Welcome Pop-up Modal',
    status: 'active',
    county: 'Montserrado',
    isMock: true,
    notes: 'J.J. Roberts United Methodist School STEM club lead & clean water innovator'
  },
  {
    id: 'mock-sub-3',
    email: 'youthofficer@nimba.gov.lr',
    category: 'County Qualifiers',
    subscribedAt: '2025-02-20 11:00',
    source: 'Footer Newsletter',
    status: 'active',
    county: 'Nimba',
    isMock: true,
    notes: 'Nimba County Youth & Sports Directorate regional tournament coordinator'
  },
  {
    id: 'mock-sub-4',
    email: 'orator.alumni@cwa.edu.lr',
    category: 'Debate & Oratory',
    subscribedAt: '2025-02-21 16:45',
    source: 'Footer Newsletter',
    status: 'active',
    county: 'Montserrado',
    isMock: true,
    notes: 'College of West Africa debate captain alumnus & mentor'
  },
  {
    id: 'mock-sub-5',
    email: 'innovation.grantee@lofa.stem.lr',
    category: 'STEM & Robotics',
    subscribedAt: '2025-02-22 10:20',
    source: 'Admin Manual Entry',
    status: 'active',
    county: 'Lofa',
    isMock: true,
    notes: 'Voinjama Multilateral High School agricultural solar-dryer team'
  },
  {
    id: 'mock-sub-6',
    email: 'scholarship.desk@cuttington.edu.lr',
    category: 'Scholarships & Grants',
    subscribedAt: '2025-02-23 08:50',
    source: 'Welcome Pop-up Modal',
    status: 'active',
    county: 'Bong',
    isMock: true,
    notes: 'Cuttington University admissions & debate scholarship desk'
  },
  {
    id: 'mock-sub-7',
    email: 'principal@bassa.high.gov.lr',
    category: 'All Dispatches',
    subscribedAt: '2025-02-24 13:10',
    source: 'Footer Newsletter',
    status: 'active',
    county: 'Grand Bassa',
    isMock: true,
    notes: 'Bassa High School Buchanan campus administration'
  }
];

// Helper to retrieve local mock + saved subscriber state
export function getLocalStoredSubscribers(): SubscriberItem[] {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all required fields exist
        return parsed.map((item, idx) => ({
          id: item.id || `sub-stored-${idx}-${item.email || Date.now()}`,
          email: item.email || '',
          category: item.category || 'All Dispatches',
          subscribedAt: item.subscribedAt || '2025-02-20',
          source: item.source || 'Footer Newsletter',
          status: item.status || 'active',
          county: item.county || 'Montserrado',
          isMock: item.isMock !== undefined ? Boolean(item.isMock) : (item.id?.startsWith('mock-') || false),
          notes: item.notes || ''
        })).filter(s => s.email && s.email.includes('@'));
      }
    }
  } catch (err) {
    console.warn('Error reading stored subscribers:', err);
  }
  return INITIAL_MOCK_SUBSCRIBERS;
}

// Helper to save local subscribers and notify listeners
export function saveLocalStoredSubscribers(items: SubscriberItem[]): void {
  try {
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(SUBSCRIBERS_UPDATED_EVENT, { detail: items }));
  } catch (err) {
    console.warn('Error saving local subscribers:', err);
  }
}

/**
 * Main function to subscribe an email:
 * 1. Checks for duplicate email.
 * 2. Writes to Firestore `subscribers` collection (if reachable).
 * 3. Writes to LocalStorage.
 * 4. Broadcasts event so open Admin Box / Footers update live.
 */
export async function subscribeToNewsletter(params: {
  email: string;
  category?: string;
  source?: 'Footer Newsletter' | 'Welcome Pop-up Modal' | 'Admin Manual Entry' | string;
  county?: string;
  notes?: string;
}): Promise<{ success: boolean; isNew: boolean; subscriber: SubscriberItem; message: string }> {
  const emailTrimmed = params.email.trim().toLowerCase();
  if (!emailTrimmed || !emailTrimmed.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const category = params.category || 'All Dispatches';
  const source = params.source || 'Footer Newsletter';
  const county = params.county || 'Montserrado';
  const notes = params.notes || '';

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const currentLocal = getLocalStoredSubscribers();
  const existingIndex = currentLocal.findIndex(s => s.email.toLowerCase() === emailTrimmed);

  if (existingIndex >= 0) {
    const existing = currentLocal[existingIndex];
    // If it was unsubscribed, reactivate it
    if (existing.status === 'unsubscribed') {
      const updated: SubscriberItem = {
        ...existing,
        status: 'active',
        category,
        subscribedAt: formattedDate,
        notes: notes || existing.notes
      };
      currentLocal[existingIndex] = updated;
      saveLocalStoredSubscribers(currentLocal);

      // Attempt Firestore update if doc exists
      try {
        if (db && !existing.isMock && existing.id && !existing.id.startsWith('mock-')) {
          await updateDoc(doc(db, 'subscribers', existing.id), {
            status: 'active',
            category,
            updatedAt: formattedDate
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `subscribers/${existing.id}`);
      }

      return {
        success: true,
        isNew: false,
        subscriber: updated,
        message: `Welcome back! "${emailTrimmed}" subscription has been reactivated for ${category}.`
      };
    }

    return {
      success: true,
      isNew: false,
      subscriber: existing,
      message: `"${emailTrimmed}" is already subscribed to ${existing.category}.`
    };
  }

  // Create new subscriber
  let firestoreDocId: string | null = null;
  const newSubscriberPayload = {
    email: emailTrimmed,
    category,
    source,
    county,
    notes,
    status: 'active' as const,
    isMock: false,
    subscribedAt: formattedDate,
    createdAt: formattedDate,
    authorUid: auth.currentUser?.uid || null
  };

  try {
    if (db) {
      const docRef = await addDoc(collection(db, 'subscribers'), newSubscriberPayload);
      firestoreDocId = docRef.id;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'subscribers');
  }

  const newSubscriber: SubscriberItem = {
    id: firestoreDocId || `sub-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...newSubscriberPayload
  };

  const updatedList = [newSubscriber, ...currentLocal];
  saveLocalStoredSubscribers(updatedList);

  return {
    success: true,
    isNew: true,
    subscriber: newSubscriber,
    message: `Thank you! "${emailTrimmed}" has been successfully subscribed to ${category}.`
  };
}

/**
 * Realtime listener for subscribers.
 * Subscribes to Firestore `subscribers` collection, merges with local mock list,
 * and updates seamlessly when local or remote events occur.
 */
export function subscribeToSubscribersList(
  callback: (subscribers: SubscriberItem[]) => void
): () => void {
  // Emit initial state immediately from localStorage/mock
  const initialLocal = getLocalStoredSubscribers();
  callback(initialLocal);

  let isUnmounted = false;
  let unsubscribeFirestore: (() => void) | null = null;

  // Listen to LocalStorage & CustomEvents
  const handleLocalUpdate = () => {
    if (!isUnmounted) {
      const updated = getLocalStoredSubscribers();
      callback(updated);
    }
  };

  window.addEventListener(SUBSCRIBERS_UPDATED_EVENT, handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  // If Firestore is available, attach live onSnapshot listener
  try {
    if (db) {
      const colRef = collection(db, 'subscribers');
      unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
        if (isUnmounted) return;

        const remoteItems: SubscriberItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteItems.push({
            id: docSnap.id,
            email: data.email || '',
            category: data.category || 'All Dispatches',
            subscribedAt: data.subscribedAt || data.createdAt || '2025-02-20',
            source: data.source || 'Live Website Subscription',
            status: data.status || 'active',
            county: data.county || 'Montserrado',
            isMock: Boolean(data.isMock),
            notes: data.notes || '',
            authorUid: data.authorUid || undefined,
            createdAt: data.createdAt || undefined,
            updatedAt: data.updatedAt || undefined
          });
        });

        // Merge remote items with local mock items (deduplicating by email)
        const localItems = getLocalStoredSubscribers();
        const mergedMap = new Map<string, SubscriberItem>();

        // 1. Add mock subscribers first
        INITIAL_MOCK_SUBSCRIBERS.forEach(item => {
          mergedMap.set(item.email.toLowerCase(), item);
        });

        // 2. Add local storage items (which may override mock or have user submissions)
        localItems.forEach(item => {
          mergedMap.set(item.email.toLowerCase(), item);
        });

        // 3. Add remote Firestore items (authoritative for live submissions)
        remoteItems.forEach(item => {
          mergedMap.set(item.email.toLowerCase(), item);
        });

        const merged = Array.from(mergedMap.values()).sort((a, b) => {
          return new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime();
        });

        // Persist to local cache
        try {
          localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }

        callback(merged);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'subscribers');
      });
    }
  } catch (err) {
    console.warn('Firestore subscription not available, using local subscribers engine:', err);
  }

  return () => {
    isUnmounted = true;
    window.removeEventListener(SUBSCRIBERS_UPDATED_EVENT, handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * Remove / Delete a subscriber
 */
export async function deleteSubscriber(id: string, email: string): Promise<boolean> {
  // Update local storage
  const current = getLocalStoredSubscribers();
  const filtered = current.filter(s => s.id !== id && s.email.toLowerCase() !== email.toLowerCase());
  saveLocalStoredSubscribers(filtered);

  // Attempt delete from Firestore if not a pure mock ID
  try {
    if (db && !id.startsWith('mock-')) {
      await deleteDoc(doc(db, 'subscribers', id));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `subscribers/${id}`);
  }

  return true;
}

/**
 * Toggle subscriber active / unsubscribed status
 */
export async function updateSubscriberStatus(id: string, newStatus: 'active' | 'unsubscribed'): Promise<boolean> {
  const current = getLocalStoredSubscribers();
  const updated = current.map(s => {
    if (s.id === id) {
      return { ...s, status: newStatus };
    }
    return s;
  });
  saveLocalStoredSubscribers(updated);

  try {
    if (db && !id.startsWith('mock-')) {
      await updateDoc(doc(db, 'subscribers', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `subscribers/${id}`);
  }

  return true;
}

/**
 * Reset to default mock subscribers
 */
export function resetMockSubscribers(): SubscriberItem[] {
  saveLocalStoredSubscribers(INITIAL_MOCK_SUBSCRIBERS);
  return INITIAL_MOCK_SUBSCRIBERS;
}

/**
 * Export subscribers to CSV format
 */
export function exportSubscribersToCSV(subscribers: SubscriberItem[]): string {
  const headers = ['Email', 'Category', 'Subscribed At', 'Source', 'County', 'Status', 'Is Mock', 'Notes'];
  const rows = subscribers.map(s => [
    `"${s.email}"`,
    `"${s.category}"`,
    `"${s.subscribedAt}"`,
    `"${s.source || ''}"`,
    `"${s.county || ''}"`,
    `"${s.status}"`,
    `"${s.isMock ? 'Mock' : 'Live'}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
