import { ASPECT_RATIOS } from './constants'
import type { LayoutInput, LayoutRect, LayoutResult } from './types'
import { aspectFor, columnsFor, coverCrop, normalizeGap } from './util'

/**
 * Computes a fixed-scale uniform grid where every image shares one cell size.
 *
 * Zoom maps to a target tile width, which determines the number of columns.
 * Each cell uses the configured aspect-ratio preset and each source image is
 * center-cropped with cover semantics to fill that identical cell.
 */
export function fixedScaleLayout(input: LayoutInput): LayoutResult {
  const { items, containerWidth, settings } = input
  const cols = columnsFor(input)

  if (items.length === 0 || containerWidth <= 0 || cols === 0) {
    return { rects: [], height: 0 }
  }

  const gap = normalizeGap(settings.gap)
  const cellWidth = (containerWidth - gap * (cols - 1)) / cols
  const cellHeight = cellWidth / ASPECT_RATIOS[settings.aspectRatio]
  const rects: LayoutRect[] = items.map((item, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = col * (cellWidth + gap)
    const y = row * (cellHeight + gap)
    const crop = coverCrop(aspectFor(item), cellWidth, cellHeight)

    return { index, x, y, width: cellWidth, height: cellHeight, crop }
  })
  const rows = Math.ceil(items.length / cols)
  const height = rows * cellHeight + gap * Math.max(0, rows - 1)

  return { rects, height }
}
