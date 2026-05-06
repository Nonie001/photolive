"use client";

/**
 * IndexedDB cache of per-photo face descriptors.
 * Avoids re-running detection on every search for the same event.
 *
 * Key: photo id (uuid). Value: array of Float32Array descriptors (one per face).
 */

const DB_NAME = "photolive-faces";
const STORE = "descriptors";
const VERSION = 1;

type StoredEntry = {
  id: string;
  faces: number[][]; // descriptors as plain arrays for IDB serialization
  cachedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function getCachedFaces(id: string): Promise<Float32Array[] | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      const entry = req.result as StoredEntry | undefined;
      if (!entry) resolve(null);
      else resolve(entry.faces.map((arr) => Float32Array.from(arr)));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setCachedFaces(
  id: string,
  faces: Float32Array[],
): Promise<void> {
  const db = await openDb();
  const entry: StoredEntry = {
    id,
    faces: faces.map((f) => Array.from(f)),
    cachedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
