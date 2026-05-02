/**
 * Utility for transferring large design images between homepage mini-studio
 * and the full Design Studio using IndexedDB (sessionStorage has a ~5MB limit
 * which data-URL images easily exceed).
 */

const DB_NAME = 'nyzora-design-transfer';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeDesignImages(images: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(images, 'generated-variations');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('IndexedDB store failed, falling back to sessionStorage:', e);
    try {
      sessionStorage.setItem('homepage-generated-images', JSON.stringify(images));
    } catch {
      // quota exceeded – nothing we can do
    }
  }
}

export async function retrieveDesignImages(): Promise<string[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('generated-variations');
    const result = await new Promise<string[] | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    // Clean up after retrieval
    if (result) {
      store.delete('generated-variations');
    }
    db.close();
    return result;
  } catch (e) {
    console.warn('IndexedDB retrieve failed, trying sessionStorage:', e);
    const fallback = sessionStorage.getItem('homepage-generated-images');
    if (fallback) {
      sessionStorage.removeItem('homepage-generated-images');
      try {
        return JSON.parse(fallback);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function clearDesignImages(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('generated-variations');
    db.close();
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem('homepage-generated-images');
    sessionStorage.removeItem('homepage-generated-image');
  } catch {
    // ignore
  }
}

/**
 * Generic JSON payload storage in IndexedDB. Used for large objects (e.g.
 * pending design submission data containing base64 images) that exceed the
 * ~5MB localStorage quota.
 */
export async function storePayload(key: string, payload: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(payload, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn(`IndexedDB store failed for key "${key}":`, e);
    throw e;
  }
}

export async function retrievePayload<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    const result = await new Promise<T | null>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch (e) {
    console.warn(`IndexedDB retrieve failed for key "${key}":`, e);
    return null;
  }
}

export async function clearPayload(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    db.close();
  } catch {
    // ignore
  }
}
