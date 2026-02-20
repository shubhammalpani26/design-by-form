/**
 * Utility for transferring large design images between homepage mini-studio
 * and the full Design Studio using IndexedDB (sessionStorage has a ~5MB limit
 * which data-URL images easily exceed).
 */

const DB_NAME = 'formo-design-transfer';
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
