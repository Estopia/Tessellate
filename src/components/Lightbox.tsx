import { useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ImageItem } from '../lib/layout'

interface LightboxProps {
  images: ImageItem[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/** Fullscreen image preview with keyboard + button navigation. */
export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const image = images[index]

  const go = useCallback(
    (dir: number) => {
      const n = images.length
      if (n === 0) return
      onNavigate((index + dir + n) % n)
    },
    [images.length, index, onNavigate],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Close if the current image disappears (e.g. removed while open).
  useEffect(() => {
    if (!image) onClose()
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={image.name}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
          className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <img
        src={image.url}
        alt={image.name}
        className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
          className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 max-w-[80vw] -translate-x-1/2 truncate rounded-full bg-black/60 px-3 py-1 text-sm text-zinc-200">
        {index + 1} / {images.length} · {image.name}
      </div>
    </div>
  )
}
