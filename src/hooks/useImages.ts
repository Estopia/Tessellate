import { useCallback, useEffect, useRef, useState } from 'react'
import { loadImage, revokeImage } from '../lib/image'
import type { ImageItem } from '../lib/layout'

/** Only bitmap image types are accepted. */
const ACCEPTED_TYPE = /^image\//
/** Reject anything larger than this to avoid locking up the browser. */
const MAX_BYTES = 30 * 1024 * 1024
/** How long "Clear all" can be undone before object URLs are actually revoked. */
const CLEAR_UNDO_MS = 6000

let idCounter = 0
const nextId = () => `img_${Date.now().toString(36)}_${(idCounter++).toString(36)}`

/** Stable de-duplication key for a File. */
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

export interface UseImagesResult {
  images: ImageItem[]
  /** True while a batch of files is being decoded. */
  isLoading: boolean
  /** The most recent rejection reason (unsupported type / too large), if any. */
  lastError: string | null
  addFiles: (files: FileList | File[]) => Promise<void>
  removeImage: (id: string) => void
  /** Clears all images. Object URLs aren't revoked immediately — see {@link undoClear}. */
  clearImages: () => void
  /** Restores the images removed by the most recent {@link clearImages}, if still within the undo window. */
  undoClear: () => void
  /** Whether a just-cleared batch can still be restored via {@link undoClear}. */
  canUndoClear: boolean
  /** Dismiss the current `lastError`, if any. */
  clearLastError: () => void
  /** Move an image from one index to another (used by drag-to-reorder). */
  reorderImages: (fromIndex: number, toIndex: number) => void
}

/**
 * Owns the in-memory list of uploaded images. All decoding happens client-side
 * via {@link loadImage}; the original `File` is retained for full-resolution
 * export. Object URLs are revoked on removal, clear (after a short undo
 * window), and unmount to avoid leaks.
 */
export function useImages(): UseImagesResult {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [canUndoClear, setCanUndoClear] = useState(false)

  // Mirror the latest images in a ref so async work and unmount cleanup can read
  // them without re-creating callbacks or stale closures. Synced via an effect so
  // we never write to the ref during render.
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // Images removed by the most recent `clearImages()`, kept around (URLs not
  // yet revoked) until the undo window elapses or `undoClear()` is called.
  const pendingClearRef = useRef<{ images: ImageItem[]; timer: ReturnType<typeof setTimeout> } | null>(
    null,
  )

  const finalizePendingClear = useCallback(() => {
    const pending = pendingClearRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pending.images.forEach((i) => revokeImage(i.url))
    pendingClearRef.current = null
    setCanUndoClear(false)
  }, [])

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

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) revokeImage(target.url)
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  const clearImages = useCallback(() => {
    setImages((prev) => {
      if (prev.length === 0) return prev
      // Finalize any earlier pending clear first (shouldn't normally happen).
      finalizePendingClear()
      const timer = setTimeout(finalizePendingClear, CLEAR_UNDO_MS)
      pendingClearRef.current = { images: prev, timer }
      setCanUndoClear(true)
      return []
    })
  }, [finalizePendingClear])

  const undoClear = useCallback(() => {
    const pending = pendingClearRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingClearRef.current = null
    setCanUndoClear(false)
    setImages(pending.images)
  }, [])

  const clearLastError = useCallback(() => setLastError(null), [])

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
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
      const next = prev.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  // Revoke every object URL (including any still-pending clear) when the app unmounts.
  useEffect(
    () => () => {
      imagesRef.current.forEach((i) => revokeImage(i.url))
      if (pendingClearRef.current) {
        clearTimeout(pendingClearRef.current.timer)
        pendingClearRef.current.images.forEach((i) => revokeImage(i.url))
      }
    },
    [],
  )

  return {
    images,
    isLoading,
    lastError,
    addFiles,
    removeImage,
    clearImages,
    undoClear,
    canUndoClear,
    clearLastError,
    reorderImages,
  }
}
