import type { CropRect, ImageItem } from '../layout/types'
import { loadImageElement } from './loadElement'

export type ExportOptions = {
  format?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
  background?: string
}

/**
 * Exports a cropped image at full source resolution.
 */
export async function cropImageToBlob(
  item: ImageItem,
  crop: CropRect,
  options: ExportOptions = {},
): Promise<Blob> {
  const format = options.format ?? 'image/png'
  const quality = options.quality ?? 0.92
  const image = await loadImageElement(item.url)
  const sourceX = crop.sx * item.naturalWidth
  const sourceY = crop.sy * item.naturalHeight
  const sourceWidth = crop.sw * item.naturalWidth
  const sourceHeight = crop.sh * item.naturalHeight
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to create canvas rendering context')
  }

  canvas.width = Math.round(sourceWidth)
  canvas.height = Math.round(sourceHeight)

  if (format === 'image/jpeg' || options.background) {
    context.fillStyle = options.background ?? '#0b0c0f'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export cropped image'))
          return
        }

        resolve(blob)
      },
      format,
      quality,
    )
  })
}
