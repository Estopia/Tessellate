import type { ImageItem, LayoutRect, LayoutResult } from '../layout/types'
import { loadImageElement } from './loadElement'

export type ComposeOptions = {
  gap?: number
  background?: string
  format?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

/**
 * Renders a complete layout result to a single image blob.
 */
export async function composeGridToBlob(
  items: ImageItem[],
  result: LayoutResult,
  containerWidth: number,
  options: ComposeOptions = {},
): Promise<Blob> {
  const format = options.format ?? 'image/png'
  const quality = options.quality ?? 0.92
  const maxWidth = options.maxWidth ?? 4096
  const maxHeight = options.maxHeight ?? 16384
  const safeWidth = Math.max(containerWidth, 1)
  const safeHeight = Math.max(result.height, 1)
  // Bound BOTH axes (not just width): a tall grid multiplied by `scale` can
  // otherwise exceed the browser's maximum canvas dimensions, which makes
  // toBlob() return null and the export silently fail. Downscale to fit instead.
  const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight, 3)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to create canvas rendering context')
  }

  canvas.width = Math.max(1, Math.round(safeWidth * scale))
  canvas.height = Math.max(1, Math.round(safeHeight * scale))

  if (options.background !== 'transparent' || format === 'image/jpeg') {
    context.fillStyle = options.background ?? '#0b0c0f'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  const referencedItems = new Map<string, ImageItem>()

  for (const rect of result.rects) {
    const item = items[rect.index]

    if (!item) {
      throw new Error(`Missing image item for layout rect index ${rect.index}`)
    }

    referencedItems.set(item.id, item)
  }

  const images = new Map<string, HTMLImageElement>()

  await Promise.all(
    Array.from(referencedItems.values(), async (item) => {
      images.set(item.id, await loadImageElement(item.url))
    }),
  )

  for (const rect of result.rects) {
    drawLayoutRect(context, items, images, rect, scale)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export composed grid'))
          return
        }

        resolve(blob)
      },
      format,
      quality,
    )
  })
}

function drawLayoutRect(
  context: CanvasRenderingContext2D,
  items: ImageItem[],
  images: Map<string, HTMLImageElement>,
  rect: LayoutRect,
  scale: number,
): void {
  const item = items[rect.index]
  const image = item ? images.get(item.id) : undefined

  if (!item || !image) {
    throw new Error(`Missing image for layout rect index ${rect.index}`)
  }

  context.drawImage(
    image,
    rect.crop.sx * item.naturalWidth,
    rect.crop.sy * item.naturalHeight,
    rect.crop.sw * item.naturalWidth,
    rect.crop.sh * item.naturalHeight,
    rect.x * scale,
    rect.y * scale,
    rect.width * scale,
    rect.height * scale,
  )
}
