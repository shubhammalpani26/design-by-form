/**
 * Draft persistence for the Originals flow.
 *
 * Buyers routinely leave the page (payment window, back button, tab switch)
 * and lose their upload and their render. We keep the whole draft — photo,
 * typed details and the render we produced — in IndexedDB so it survives a
 * reload. IndexedDB rather than localStorage because a photo data URL is far
 * bigger than the localStorage quota allows.
 */
export interface OriginalsDraft {
  skuSlug: string;
  savedAt: number;
  mode: "photo" | "template";
  photo: { dataUrl: string; name: string } | null;
  heading: string;
  footnote: string;
  values: Record<string, string>;
  colorKey: string;
  sizeKey: string;
  preview: { url: string; id: string | null; remaining: number } | null;
}

const DB_NAME = "nyzora-originals";
const STORE = "drafts";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft: OriginalsDraft): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(draft, draft.skuSlug);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* best-effort — never block the flow on storage */
  }
}

export async function loadDraft(skuSlug: string): Promise<OriginalsDraft | null> {
  try {
    const db = await open();
    const draft = await new Promise<OriginalsDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(skuSlug);
      req.onsuccess = () => resolve((req.result as OriginalsDraft) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!draft) return null;
    if (Date.now() - (draft.savedAt ?? 0) > MAX_AGE_MS) {
      await clearDraft(skuSlug);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export async function clearDraft(skuSlug: string): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(skuSlug);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    /* ignore */
  }
}
