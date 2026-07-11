import { loadImageElement } from './loadElement'

export type RotateDirection = 1 | -1

export interface TransformedImage {
  url: string
  naturalWidth: number
  naturalHeight: number
}

/**
 * Rotates the image at `url` by 90° (clockwise for `direction = 1`,
 * counter-clockwise for `-1`) and re-encodes it as a PNG.
 *
 * Rotation is applied to the actual pixel data (not a CSS transform) so every
 * downstream consumer — grid layout, crop math, DOM rendering, canvas export —
 * keeps working unmodified: the resulting `ImageItem` just looks like a
 * normal, already-rotated source image with swapped natural dimensions.
 */
export async function rotateImageBlob(url: string, direction: RotateDirection): Promise<TransformedImage> {
  const image = await loadImageElement(url)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalHeight
  canvas.height = image.naturalWidth

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to create canvas rendering context')
  }

  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate((direction * Math.PI) / 2)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  return canvasToTransformedImage(canvas)
}

/** Mirrors the image at `url` horizontally and re-encodes it as a PNG. */
export async function flipImageBlob(url: string): Promise<TransformedImage> {
  const image = await loadImageElement(url)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to create canvas rendering context')
  }

  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  context.drawImage(image, 0, 0)

  return canvasToTransformedImage(canvas)
}

function canvasToTransformedImage(canvas: HTMLCanvasElement): Promise<TransformedImage> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to re-encode transformed image'))
        return
      }

      resolve({
        url: URL.createObjectURL(blob),
        naturalWidth: canvas.width,
        naturalHeight: canvas.height,
      })
    }, 'image/png')
  })
}
