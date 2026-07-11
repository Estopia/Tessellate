import { useCallback, useEffect, useRef, useState } from 'react'
import { flipImageBlob, loadImage, revokeImage, rotateImageBlob } from '../lib/image'
import type { ImageItem } from '../lib/layout'
import {
  clearPersistedImages,
  getAllPersistedImages,
  replaceAllImages,
  type StoredImageRecord,
} from '../lib/persistence/imageStore'

/** Only bitmap image types are accepted. */
const ACCEPTED_TYPE = /^image\//
/** Reject anything larger than this to avoid locking up the browser. */
const MAX_BYTES = 30 * 1024 * 1024
/** How long a destructive action (remove/clear/reorder) can be undone before it's finalized. */
const UNDO_WINDOW_MS = 6000
/** Debounce for mirroring the image list into IndexedDB when persistence is enabled. */
const PERSIST_DEBOUNCE_MS = 400

let idCounter = 0
const nextId = () => `img_${Date.now().toString(36)}_${(idCounter++).toString(36)}`

/** Stable de-duplication key for a File. */
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

type UndoEntry =
  | { type: 'clear'; images: ImageItem[] }
  | { type: 'remove'; image: ImageItem; index: number }
  | { type: 'bulk-remove'; entries: { image: ImageItem; index: number }[] }
  | { type: 'reorder'; from: number; to: number }

function describeUndo(entry: UndoEntry): string {
  switch (entry.type) {
    case 'clear':
      return 'Cleared all images.'
    case 'remove':
      return 'Removed 1 image.'
    case 'bulk-remove': {
      const n = entry.entries.length
      return `Removed ${n} image${n === 1 ? '' : 's'}.`
    }
    case 'reorder':
      return 'Moved image.'
  }
}

/** Revokes the object URL(s) referenced by an undo entry (called once it's no longer undoable). */
function revokeUndoEntry(entry: UndoEntry): void {
  switch (entry.type) {
    case 'clear':
      entry.images.forEach((i) => revokeImage(i.url))
      break
    case 'remove':
      revokeImage(entry.image.url)
      break
    case 'bulk-remove':
      entry.entries.forEach((e) => revokeImage(e.image.url))
      break
    case 'reorder':
      break
  }
}

export interface UseImagesResult {
  images: ImageItem[]
  /** True while a batch of files is being decoded. */
  isLoading: boolean
  /** The most recent rejection reason (unsupported type / too large), if any. */
  lastError: string | null
  /** Dismiss the current `lastError`, if any. */
  clearLastError: () => void
  addFiles: (files: FileList | File[]) => Promise<void>
  removeImage: (id: string) => void
  /** Removes multiple images at once (used by multi-select bulk actions). */
  removeImages: (ids: string[]) => void
  /** Clears all images. Nothing is revoked immediately — see {@link undo}. */
  clearImages: () => void
  /** Move an image from one index to another (used by drag-to-reorder). */
  reorderImages: (fromIndex: number, toIndex: number) => void
  /** Rotates an image 90° clockwise (or counter-clockwise) by re-encoding its pixels. */
  rotateImage: (id: string, direction?: 1 | -1) => Promise<void>
  /** Mirrors an image horizontally by re-encoding its pixels. */
  flipImage: (id: string) => Promise<void>
  /** Reverts the most recent remove/clear/reorder, if still within the undo window. */
  undo: () => void
  /** Whether {@link undo} currently has something to do. */
  canUndo: boolean
  /** Human-readable description of the pending undo-able action, for a toast. */
  undoLabel: string | null
}

/**
 * Owns the in-memory list of uploaded images. All decoding happens client-side
 * via {@link loadImage}; the original `File` is retained for full-resolution
 * export. Destructive actions (remove/clear/reorder) are undoable for a short
 * grace window; object URLs are only actually revoked once that window lapses
 * (or a new destructive action replaces the pending one).
 *
 * When `persistEnabled` is true, the image list is mirrored into IndexedDB so
 * it survives a reload; this is opt-in (default off) to keep the app
 * privacy-first by default. See src/lib/persistence/imageStore.ts.
 */
export function useImages(persistEnabled: boolean): UseImagesResult {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [undoLabel, setUndoLabel] = useState<string | null>(null)

  // Mirror the latest images in a ref so async work and unmount cleanup can read
  // them without re-creating callbacks or stale closures. Synced via an effect so
  // we never write to the ref during render.
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  const pendingRef = useRef<{ entry: UndoEntry; timer: ReturnType<typeof setTimeout> } | null>(null)

  const finalizePending = useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    revokeUndoEntry(pending.entry)
    pendingRef.current = null
    setUndoLabel(null)
  }, [])

  const pushUndo = useCallback(
    (entry: UndoEntry) => {
      finalizePending()
      const timer = setTimeout(finalizePending, UNDO_WINDOW_MS)
      pendingRef.current = { entry, timer }
      setUndoLabel(describeUndo(entry))
    },
    [finalizePending],
  )

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = Array.from(files)
    const accepted = incoming.filter((f) => ACCEPTED_TYPE.test(f.type) && f.size <= MAX_BYTES)
    const rejected = incoming.length - accepted.length
    setLastError(rejected > 0 ? `Skipped ${rejected} unsupported or oversized file(s).` : null)
    if (accepted.length === 0) return

    setIsLoading(true)
    try {
      const seen = new Set(imagesRef.current.map((i) => fileKey(i.file)))
      const loaded: ImageItem[] = []
      for (const file of accepted) {
        const key = fileKey(file)
        if (seen.has(key)) continue
        seen.add(key)
        try {
          const { url, naturalWidth, naturalHeight } = await loadImage(file)
          loaded.push({ id: nextId(), url, file, name: file.name, naturalWidth, naturalHeight })
        } catch {
          // Skip files the browser cannot decode.
        }
      }
      if (loaded.length > 0) setImages((prev) => [...prev, ...loaded])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const index = prev.findIndex((i) => i.id === id)
        if (index === -1) return prev
        pushUndo({ type: 'remove', image: prev[index], index })
        return prev.filter((i) => i.id !== id)
      })
    },
    [pushUndo],
  )

  const removeImages = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids)
      setImages((prev) => {
        const entries = prev
          .map((image, index) => ({ image, index }))
          .filter((e) => idSet.has(e.image.id))
        if (entries.length === 0) return prev
        pushUndo({ type: 'bulk-remove', entries })
        return prev.filter((i) => !idSet.has(i.id))
      })
    },
    [pushUndo],
  )

  const clearImages = useCallback(() => {
    setImages((prev) => {
      if (prev.length === 0) return prev
      pushUndo({ type: 'clear', images: prev })
      return []
    })
  }, [pushUndo])

  const reorderImages = useCallback(
    (fromIndex: number, toIndex: number) => {
      setImages((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length
        ) {
          return prev
        }
        pushUndo({ type: 'reorder', from: fromIndex, to: toIndex })
        const next = prev.slice()
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      })
    },
    [pushUndo],
  )

  const undo = useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingRef.current = null
    setUndoLabel(null)

    const { entry } = pending
    switch (entry.type) {
      case 'clear':
        setImages(entry.images)
        break
      case 'remove':
        setImages((prev) => {
          const next = prev.slice()
          next.splice(entry.index, 0, entry.image)
          return next
        })
        break
      case 'bulk-remove':
        setImages((prev) => {
          const next = prev.slice()
          // Insert in ascending index order so earlier insertions don't shift later ones.
          const sorted = entry.entries.slice().sort((a, b) => a.index - b.index)
          for (const e of sorted) {
            next.splice(Math.min(e.index, next.length), 0, e.image)
          }
          return next
        })
        break
      case 'reorder':
        setImages((prev) => {
          if (entry.to < 0 || entry.to >= prev.length) return prev
          const next = prev.slice()
          const [moved] = next.splice(entry.to, 1)
          next.splice(entry.from, 0, moved)
          return next
        })
        break
    }
  }, [])

  const rotateImage = useCallback(async (id: string, direction: 1 | -1 = 1) => {
    const current = imagesRef.current.find((i) => i.id === id)
    if (!current) return
    const rotated = await rotateImageBlob(current.url, direction)
    setImages((prev) => {
      const target = prev.find((i) => i.id === id)
      if (!target) {
        revokeImage(rotated.url)
        return prev
      }
      revokeImage(target.url)
      return prev.map((i) => (i.id === id ? { ...i, ...rotated } : i))
    })
  }, [])

  const flipImage = useCallback(async (id: string) => {
    const current = imagesRef.current.find((i) => i.id === id)
    if (!current) return
    const flipped = await flipImageBlob(current.url)
    setImages((prev) => {
      const target = prev.find((i) => i.id === id)
      if (!target) {
        revokeImage(flipped.url)
        return prev
      }
      revokeImage(target.url)
      return prev.map((i) => (i.id === id ? { ...i, ...flipped } : i))
    })
  }, [])

  const clearLastError = useCallback(() => setLastError(null), [])

  // --- Opt-in IndexedDB persistence -------------------------------------

  const hydratedRef = useRef(false)
  const prevPersistEnabledRef = useRef(persistEnabled)

  // Hydrate once on mount, if persistence was already enabled from a previous session.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (!persistEnabled) return

    let cancelled = false
    void (async () => {
      const records = await getAllPersistedImages()
      if (cancelled || records.length === 0) return
      const sorted = records.slice().sort((a, b) => a.order - b.order)
      const hydrated: ImageItem[] = sorted.map((record) => ({
        id: record.id,
        url: URL.createObjectURL(record.blob),
        file: new File([record.blob], record.name, { type: record.blob.type }),
        name: record.name,
        naturalWidth: record.naturalWidth,
        naturalHeight: record.naturalHeight,
      }))
      setImages(hydrated)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror the current image list into IndexedDB whenever it changes, debounced.
  useEffect(() => {
    if (!persistEnabled) {
      if (prevPersistEnabledRef.current) {
        void clearPersistedImages()
      }
      prevPersistEnabledRef.current = persistEnabled
      return
    }
    prevPersistEnabledRef.current = persistEnabled

    const handle = setTimeout(() => {
      const records: StoredImageRecord[] = images.map((image, order) => ({
        id: image.id,
        name: image.name,
        blob: image.file,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        order,
      }))
      void replaceAllImages(records)
    }, PERSIST_DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [images, persistEnabled])

  // Revoke every object URL (including any still-pending undo) when the app unmounts.
  useEffect(
    () => () => {
      imagesRef.current.forEach((i) => revokeImage(i.url))
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer)
        revokeUndoEntry(pendingRef.current.entry)
      }
    },
    [],
  )

  return {
    images,
    isLoading,
    lastError,
    clearLastError,
    addFiles,
    removeImage,
    removeImages,
    clearImages,
    reorderImages,
    rotateImage,
    flipImage,
    undo,
    canUndo: undoLabel !== null,
    undoLabel,
  }
}
