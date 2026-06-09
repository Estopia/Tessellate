import type { CropRect, Dimensions, LayoutInput } from './types'
import { FULL_CROP } from './types'

const MIN_TARGET_TILE_WIDTH = 120
const MAX_TARGET_TILE_WIDTH = 420

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const lerp = (min: number, max: number, amount: number) => min + (max - min) * amount

/** Clamps a possibly invalid zoom value into the supported normalized range. */
export const normalizeZoom = (zoom: number) => clamp(Number.isFinite(zoom) ? zoom : 0, 0, 1)

/** Converts a possibly invalid gap value into a non-negative CSS pixel gap. */
export const normalizeGap = (gap: number) => Math.max(0, Number.isFinite(gap) ? gap : 0)

/** Returns width divided by height, falling back to square images for invalid dimensions. */
export const aspectFor = ({ width, height }: Dimensions) =>
  width > 0 && height > 0 ? width / height : 1

/** Maps zoom to the target tile width shared by fixed-scale and masonry layouts. */
export const targetTileWidthForZoom = (zoom: number) =>
  lerp(MIN_TARGET_TILE_WIDTH, MAX_TARGET_TILE_WIDTH, normalizeZoom(zoom))

/** Computes the zoom-derived column count clamped to the container and item count. */
export const columnsFor = ({ items, containerWidth, settings }: LayoutInput) => {
  if (items.length === 0 || containerWidth <= 0) {
    return 0
  }

  const gap = normalizeGap(settings.gap)
  const targetTileWidth = targetTileWidthForZoom(settings.zoom)
  const rawColumns = Math.floor((containerWidth + gap) / (targetTileWidth + gap))

  return clamp(rawColumns, 1, items.length)
}

/**
 * Computes the centered source crop for CSS/object-fit-style cover rendering.
 *
 * The returned normalized rectangle selects the largest centered source region
 * whose aspect ratio matches the requested target box.
 */
export function coverCrop(srcAspect: number, targetW: number, targetH: number): CropRect {
  const safeSrcAspect = srcAspect > 0 && Number.isFinite(srcAspect) ? srcAspect : 1
  const targetAspect = targetW > 0 && targetH > 0 ? targetW / targetH : safeSrcAspect

  if (!Number.isFinite(targetAspect) || targetAspect <= 0) {
    return FULL_CROP
  }

  if (safeSrcAspect > targetAspect) {
    const sw = clamp(targetAspect / safeSrcAspect, 0, 1)
    return { sx: (1 - sw) / 2, sy: 0, sw, sh: 1 }
  }

  const sh = clamp(safeSrcAspect / targetAspect, 0, 1)
  return { sx: 0, sy: (1 - sh) / 2, sw: 1, sh }
}
