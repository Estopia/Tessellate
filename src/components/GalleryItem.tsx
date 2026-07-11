import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Download, FlipHorizontal, RotateCw, X } from 'lucide-react'
import { type CSSProperties, type PointerEvent } from 'react'
import type { ImageItem, LayoutRect } from '../lib/layout'
import { adjustmentsToFilter } from '../lib/layout'
import { cn } from '../lib/cn'
import { useSettings } from '../state/SettingsContext'

interface GalleryItemProps {
  image: ImageItem
  rect: LayoutRect
  onRemove: (id: string) => void
  onDownload: (image: ImageItem, rect: LayoutRect) => void
  onOpen: (index: number) => void
  onRotate: (id: string) => void
  onFlip: (id: string) => void
  /** Whether multi-select mode is active (disables drag, clicking toggles selection). */
  selectionMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

/**
 * A single positioned image in the grid. Absolute positioning comes from the
 * computed {@link LayoutRect}; cropping is achieved with `object-fit: cover`
 * plus an `object-position` derived from the rect's crop (which matches the
 * centred crop used by the canvas export, so what you see is what you export).
 */
export function GalleryItem({
  image,
  rect,
  onRemove,
  onDownload,
  onOpen,
  onRotate,
  onFlip,
  selectionMode,
  isSelected,
  onToggleSelect,
}: GalleryItemProps) {
  const { settings } = useSettings()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: image.id,
    disabled: selectionMode,
  })

  const { crop } = rect
  const posX = crop.sw >= 1 ? 50 : (crop.sx / (1 - crop.sw)) * 100
  const posY = crop.sh >= 1 ? 50 : (crop.sy / (1 - crop.sh)) * 100
  const filter = adjustmentsToFilter(settings.adjustments)

  const style: CSSProperties = {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    transform: CSS.Translate.toString(transform),
    // Animate position/size changes (reorder, resize, zoom) but never while the
    // item is actively being dragged.
    transition: isDragging
      ? 'none'
      : 'left 200ms ease, top 200ms ease, width 200ms ease, height 200ms ease',
    zIndex: isDragging ? 50 : undefined,
    touchAction: 'manipulation',
  }

  const stop = (e: PointerEvent) => e.stopPropagation()

  const handleClick = () => {
    if (selectionMode) onToggleSelect(image.id)
    else onOpen(rect.index)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'group absolute overflow-hidden rounded-md bg-surface-2 select-none',
        isDragging
          ? 'ring-text/60 cursor-grabbing opacity-90 shadow-2xl ring-2'
          : selectionMode
            ? 'cursor-pointer'
            : 'cursor-grab',
        isSelected && 'ring-accent ring-2',
      )}
    >
      <img
        src={image.url}
        alt={image.name}
        draggable={false}
        loading="lazy"
        className="h-full w-full object-cover"
        style={{ objectPosition: `${posX}% ${posY}%`, filter }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {selectionMode && (
        <div
          aria-hidden
          className={cn(
            'absolute top-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full border-2 backdrop-blur transition-colors',
            isSelected ? 'border-accent bg-accent' : 'border-white/70 bg-black/40',
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-accent-text" />}
        </div>
      )}

      {!selectionMode && (
        <div className="gallery-item-controls absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            aria-label={`Rotate ${image.name}`}
            title="Rotate 90°"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation()
              onRotate(image.id)
            }}
            className="grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Flip ${image.name} horizontally`}
            title="Flip horizontally"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation()
              onFlip(image.id)
            }}
            className="grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Download ${image.name}`}
            title="Download cropped image"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation()
              onDownload(image, rect)
            }}
            className="grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Remove ${image.name}`}
            title="Remove"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(image.id)
            }}
            className="grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition-colors hover:bg-danger focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

