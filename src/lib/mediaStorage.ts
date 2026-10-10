/**
 * mediaStorage.ts
 * Client-side persistent IndexedDB storage for video files and high-res media.
 * Ensures videos uploaded directly from the user's computer play seamlessly,
 * buffer-free, and persist even across dev server restarts and page refreshes.
 */

const DB_NAME = 'YFC_Liberia_Media_DB';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

// In-memory cache of object URLs to prevent duplicate createObjectURL calls
const memoryBlobUrlCache = new Map<string, string>();

/**
 * Open or upgrade the IndexedDB database
 */
function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open Media IndexedDB'));
    };
  });
}

/**
 * Stores a video File or Blob into IndexedDB under multiple keys for resilient retrieval
 * @param key unique identifier (e.g., file server URL, item id, or filename)
 * @param blob the raw video File/Blob
 */
export async function storeVideoBlob(key: string, blob: Blob | File): Promise<string> {
  if (!key || !blob) return '';

  const cleanKey = key.trim();
  const baseName = cleanKey.split('/').pop()?.split('?')[0] || cleanKey;
  const strippedName = baseName.replace(/^(vid|img)_\d+_/, '');

  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Store under primary key
      store.put(blob, cleanKey);
      if (baseName && baseName !== cleanKey) {
        store.put(blob, baseName);
      }
      if (strippedName && strippedName !== baseName && strippedName !== cleanKey) {
        store.put(blob, strippedName);
      }
      // Also store as latest
      store.put(blob, '__latest_uploaded_video__');

      transaction.oncomplete = () => {
        // Create memory blob url for immediate instant playback
        if (memoryBlobUrlCache.has(cleanKey)) {
          URL.revokeObjectURL(memoryBlobUrlCache.get(cleanKey)!);
        }
        const blobUrl = URL.createObjectURL(blob);
        memoryBlobUrlCache.set(cleanKey, blobUrl);
        memoryBlobUrlCache.set(baseName, blobUrl);
        memoryBlobUrlCache.set(strippedName, blobUrl);
        memoryBlobUrlCache.set('__latest_uploaded_video__', blobUrl);
        resolve(blobUrl);
      };

      transaction.onerror = () => {
        reject(transaction.error || new Error('Failed to store video in IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('IndexedDB storage warning:', err);
    // Fallback to memory blob url
    const blobUrl = URL.createObjectURL(blob);
    memoryBlobUrlCache.set(cleanKey, blobUrl);
    return blobUrl;
  }
}

/**
 * Retrieves a stored video Blob as an Object URL from IndexedDB with resilient lookup
 * @param key unique identifier
 */
export async function getVideoBlobUrl(key: string): Promise<string | null> {
  if (!key) return null;
  const cleanKey = key.trim();

  // Check in-memory cache first
  if (memoryBlobUrlCache.has(cleanKey)) {
    return memoryBlobUrlCache.get(cleanKey)!;
  }

  const baseName = cleanKey.split('/').pop()?.split('?')[0] || cleanKey;
  const strippedName = baseName.replace(/^(vid|img)_\d+_/, '');

  if (memoryBlobUrlCache.has(baseName)) {
    return memoryBlobUrlCache.get(baseName)!;
  }
  if (memoryBlobUrlCache.has(strippedName)) {
    return memoryBlobUrlCache.get(strippedName)!;
  }

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      // Try exact key first
      const getRequest = store.get(cleanKey);

      getRequest.onsuccess = () => {
        const result = getRequest.result as Blob | undefined;
        if (result && result instanceof Blob) {
          const blobUrl = URL.createObjectURL(result);
          memoryBlobUrlCache.set(cleanKey, blobUrl);
          resolve(blobUrl);
          return;
        }

        // Try baseName
        if (baseName && baseName !== cleanKey) {
          const baseReq = store.get(baseName);
          baseReq.onsuccess = () => {
            const baseRes = baseReq.result as Blob | undefined;
            if (baseRes && baseRes instanceof Blob) {
              const blobUrl = URL.createObjectURL(baseRes);
              memoryBlobUrlCache.set(cleanKey, blobUrl);
              memoryBlobUrlCache.set(baseName, blobUrl);
              resolve(blobUrl);
              return;
            }

            // Try strippedName
            if (strippedName && strippedName !== baseName) {
              const stripReq = store.get(strippedName);
              stripReq.onsuccess = () => {
                const stripRes = stripReq.result as Blob | undefined;
                if (stripRes && stripRes instanceof Blob) {
                  const blobUrl = URL.createObjectURL(stripRes);
                  memoryBlobUrlCache.set(cleanKey, blobUrl);
                  memoryBlobUrlCache.set(strippedName, blobUrl);
                  resolve(blobUrl);
                  return;
                }

                // Fallback: check all keys in store to find any matching substring
                const allKeysReq = store.getAllKeys();
                allKeysReq.onsuccess = () => {
                  const keys = allKeysReq.result as string[];
                  const matchedKey = keys.find(k => 
                    k !== '__latest_uploaded_video__' && (
                      k.includes(strippedName) || 
                      strippedName.includes(k) || 
                      k.toLowerCase().includes(strippedName.toLowerCase())
                    )
                  );

                  if (matchedKey) {
                    const matchReq = store.get(matchedKey);
                    matchReq.onsuccess = () => {
                      const matchRes = matchReq.result as Blob | undefined;
                      if (matchRes && matchRes instanceof Blob) {
                        const blobUrl = URL.createObjectURL(matchRes);
                        memoryBlobUrlCache.set(cleanKey, blobUrl);
                        resolve(blobUrl);
                        return;
                      }
                      resolve(null);
                    };
                    matchReq.onerror = () => resolve(null);
                  } else {
                    resolve(null);
                  }
                };
                allKeysReq.onerror = () => resolve(null);
              };
              stripReq.onerror = () => resolve(null);
            } else {
              resolve(null);
            }
          };
          baseReq.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return null;
  }
}

/**
 * Removes a stored video from IndexedDB
 */
export async function removeVideoBlob(key: string): Promise<void> {
  if (memoryBlobUrlCache.has(key)) {
    URL.revokeObjectURL(memoryBlobUrlCache.get(key)!);
    memoryBlobUrlCache.delete(key);
  }

  try {
    const db = await openMediaDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
  } catch (err) {
    console.warn('Error deleting from IndexedDB:', err);
  }
}

/**
 * Clears all video blobs from IndexedDB and revokes object URLs
 */
export async function clearAllVideoBlobs(): Promise<void> {
  // Revoke all in-memory URLs
  memoryBlobUrlCache.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
  memoryBlobUrlCache.clear();

  try {
    const db = await openMediaDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.warn('Error clearing IndexedDB video blobs:', err);
  }
}
