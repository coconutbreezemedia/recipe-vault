import type { AppState } from '@/lib/types';

const DB_NAME = 'recipe-vault';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const STATE_KEY = 'state';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Lazily open (and upgrade) the IndexedDB database. A single cached promise is
 * reused across calls to avoid reopening the connection on every read/write.
 * Returns a rejected promise when IndexedDB is unavailable so callers can short-circuit.
 */
function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // Out-of-line keys: no keyPath, we supply the key explicitly via put().
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });

  // If opening fails, drop the cache so a subsequent call can retry.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

export async function loadState(): Promise<AppState | null> {
  try {
    const db = await openDb();
    return await new Promise<AppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(STATE_KEY);

      request.onsuccess = () => {
        resolve((request.result as AppState | undefined) ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // SSR or IndexedDB unavailable: treat as empty.
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, STATE_KEY);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    // No-op when IndexedDB is unavailable (SSR).
  }
}
