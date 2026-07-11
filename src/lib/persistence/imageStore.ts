/**
 * Minimal IndexedDB-backed store for opt-in image persistence.
 *
 * Tessellate is privacy-first by default: uploaded images live only in
 * memory (as Blob object URLs) and disappear on reload. When a user
 * explicitly enables "keep images between reloads" in Settings, this module
 * mirrors the in-memory image list into IndexedDB so it can be restored on
 * the next visit. Disabling the setting clears the store immediately.
 */

const DB_NAME = 'tessellate'
const DB_VERSION = 1
const STORE_NAME = 'images'

export interface StoredImageRecord {
  id: string
  name: string
  blob: Blob
  naturalWidth: number
  naturalHeight: number
  /** Position in the gallery, used to restore ordering. */
  order: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const store = tx.objectStore(STORE_NAME)
        const request = run(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
        tx.oncomplete = () => db.close()
        tx.onerror = () => db.close()
      }),
  )
}

/** Replaces the entire stored image set with `records` (delete-all then put-all). */
export async function replaceAllImages(records: StoredImageRecord[]): Promise<void> {
  const db = await openDatabase()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.clear()
    for (const record of records) {
      store.put(record)
    }

    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('Failed to persist images'))
    }
  })
}

/** Removes every persisted image (used when the user turns persistence off). */
export async function clearPersistedImages(): Promise<void> {
  await withStore('readwrite', (store) => store.clear())
}

/** Reads back every persisted image, in no particular order (sort by `order` yourself). */
export async function getAllPersistedImages(): Promise<StoredImageRecord[]> {
  try {
    return await withStore('readonly', (store) => store.getAll())
  } catch {
    // IndexedDB unavailable (private browsing in some browsers, etc.) — degrade gracefully.
    return []
  }
}
