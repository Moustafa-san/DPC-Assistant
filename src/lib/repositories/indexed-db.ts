/**
 * Pure Native IndexedDB Key-Value Storage Provider.
 * Zero external dependencies, fully asynchronous, persistent across browser restarts.
 * Features BigInt-safe serialization and automatic Node.js/Test fallback.
 */

const DB_NAME = "dpc_assistant_idb";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
const nodeMemoryStore = new Map<string, unknown>();

/**
 * BigInt-Safe JSON stringifier to preserve financial minor units across storage.
 */
export function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    typeof val === "bigint" ? { __type: "bigint", value: val.toString() } : val
  );
}

/**
 * BigInt-Safe JSON parser to restore financial minor units from storage.
 */
export function safeParse<T>(jsonStr: string): T {
  return JSON.parse(jsonStr, (_key, val) => {
    if (val && typeof val === "object" && (val as { __type?: string }).__type === "bigint") {
      return BigInt((val as { value: string }).value);
    }
    return val;
  });
}

function safeClone<T>(val: T): T {
  return safeParse<T>(safeStringify(val));
}

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
 * Retrieves a value from IndexedDB with localStorage and in-memory fallback.
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  // Node / Test Environment fallback
  if (typeof window === "undefined") {
    const val = nodeMemoryStore.get(key);
    return val !== undefined ? (safeClone(val) as T) : null;
  }

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
    return raw ? safeParse<T>(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Stores a value durably in IndexedDB and syncs to localStorage.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  // Node / Test Environment fallback
  if (typeof window === "undefined") {
    nodeMemoryStore.set(key, safeClone(value));
    return;
  }

  // Sync to localStorage as immediate secondary cache
  try {
    localStorage.setItem(key, safeStringify(value));
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
  if (typeof window === "undefined") {
    nodeMemoryStore.delete(key);
    return;
  }

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
