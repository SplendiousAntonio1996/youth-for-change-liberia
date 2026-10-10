import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore, 
  Firestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

function initFirestore(): Firestore {
  const dbId = (firebaseConfig.firestoreDatabaseId && typeof firebaseConfig.firestoreDatabaseId === 'string' && firebaseConfig.firestoreDatabaseId.trim() !== '')
    ? firebaseConfig.firestoreDatabaseId.trim()
    : undefined;

  // Enable persistent IndexedDB cache for instant reads and rock-solid offline consistency
  if (typeof window !== 'undefined') {
    try {
      const cacheSettings = {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      };
      if (dbId) {
        return initializeFirestore(app, cacheSettings, dbId);
      }
      return initializeFirestore(app, cacheSettings);
    } catch (err) {
      console.warn('[Firebase] IndexedDB persistence fallback to standard firestore:', err);
    }
  }

  try {
    if (dbId) {
      return getFirestore(app, dbId);
    }
  } catch (err) {
    console.warn('[Firebase] Failed to initialize named database, falling back to default:', err);
  }
  return getFirestore(app);
}

export const db: Firestore = initFirestore();

// Non-blocking background connection check
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      if (db) {
        await getDocFromServer(doc(db, 'test', 'connection'));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firebase client operating in offline mode.');
      }
    }
  }, 2500);
}

export default app;


