/**
 * Pure Native IndexedDB Key-Value Storage Provider.
 * Zero external dependencies, fully asynchronous, persistent across browser restarts.
 */

const DB_NAME = "dpc_assistant_idb";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available in current environment."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/**
 * Retrieves a value from IndexedDB with localStorage fallback.
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  if (window.indexedDB) {
    try {
      const db = await getDb();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage if IndexedDB is blocked (e.g. private mode)
    }
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Stores a value durably in IndexedDB and syncs to localStorage.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;

  // Sync to localStorage as immediate secondary cache
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[idbSet] LocalStorage fallback write failed:", err);
  }

  if (window.indexedDB) {
    try {
      const db = await getDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn("[idbSet] IndexedDB write failed:", err);
    }
  }
}

/**
 * Deletes a key from storage.
 */
export async function idbDel(key: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {}

  if (window.indexedDB) {
    try {
      const db = await getDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }
}
