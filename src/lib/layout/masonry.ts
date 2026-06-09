import type { LayoutInput, LayoutRect, LayoutResult } from './types'
import { FULL_CROP } from './types'
import { aspectFor, columnsFor, normalizeGap } from './util'

const shortestColumnIndex = (columns: number[]) =>
  columns.reduce((shortest, current, index) => (current < columns[shortest] ? index : shortest), 0)

/**
 * Computes a masonry layout by placing each image into the shortest column.
 *
 * Zoom maps to a target tile width, which determines the number of equal-width
 * columns. Images keep their source aspect ratio, use no crop, and are appended
 * in source order to the currently shortest column.
 */
export function masonryLayout(input: LayoutInput): LayoutResult {
  const { items, containerWidth, settings } = input
  const cols = columnsFor(input)

  if (items.length === 0 || containerWidth <= 0 || cols === 0) {
    return { rects: [], height: 0 }
  }

  const gap = normalizeGap(settings.gap)
  const colWidth = (containerWidth - gap * (cols - 1)) / cols
  const nextYs = Array.from({ length: cols }, () => 0)
  const bottoms = Array.from({ length: cols }, () => 0)
  const rects: LayoutRect[] = []

  items.forEach((item, index) => {
    const aspect = aspectFor(item)
    const col = shortestColumnIndex(nextYs)
    const x = col * (colWidth + gap)
    const y = nextYs[col]
    const height = colWidth / aspect
    const bottom = y + height

    rects.push({ index, x, y, width: colWidth, height, crop: FULL_CROP })
    bottoms[col] = bottom
    nextYs[col] = bottom + gap
  })

  return { rects, height: Math.max(...bottoms) }
}
