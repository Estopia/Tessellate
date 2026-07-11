import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import type { ImageItem, LayoutRect, LayoutResult } from '../lib/layout'
import { GalleryItem } from './GalleryItem'

interface GalleryProps {
  images: ImageItem[]
  layout: LayoutResult
  onReorder: (fromIndex: number, toIndex: number) => void
  onRemove: (id: string) => void
  onDownload: (image: ImageItem, rect: LayoutRect) => void
  onOpen: (index: number) => void
  onRotate: (id: string) => void
  onFlip: (id: string) => void
  selectionMode: boolean
  isSelected: (id: string) => boolean
  onToggleSelect: (id: string) => void
}

/**
 * Renders the computed layout as an absolutely-positioned grid and wires up
 * drag-to-reorder via dnd-kit. Mouse uses a small movement threshold (so a
 * click opens the lightbox, touch uses press-and-hold (so the grid can still
 * be scrolled), and keyboard reordering is supported.
 */
export function Gallery({
  images,
  layout,
  onReorder,
  onRemove,
  onDownload,
  onOpen,
  onRotate,
  onFlip,
  selectionMode,
  isSelected,
  onToggleSelect,
}: GalleryProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => images.map((i) => i.id), [images])

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from !== -1 && to !== -1) onReorder(from, to)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="relative w-full" style={{ height: layout.height }}>
          {layout.rects.map((rect) => {
            const image = images[rect.index]
            if (!image) return null
            return (
              <GalleryItem
                key={image.id}
                image={image}
                rect={rect}
                onRemove={onRemove}
                onDownload={onDownload}
                onOpen={onOpen}
                onRotate={onRotate}
                onFlip={onFlip}
                selectionMode={selectionMode}
                isSelected={isSelected(image.id)}
                onToggleSelect={onToggleSelect}
              />
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
