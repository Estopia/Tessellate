import type { CropRect, LayoutInput, LayoutRect, LayoutResult } from './types'
import { FULL_CROP } from './types'
import { aspectFor, coverCrop, normalizeGap, normalizeZoom } from './util'

const MIN_TARGET_ROW_HEIGHT = 140
const MAX_TARGET_ROW_HEIGHT = 460

interface RowItem {
  index: number
  aspect: number
}

const targetRowHeightForZoom = (zoom: number) =>
  MIN_TARGET_ROW_HEIGHT + (MAX_TARGET_ROW_HEIGHT - MIN_TARGET_ROW_HEIGHT) * normalizeZoom(zoom)

const rowFillHeight = (row: RowItem[], containerWidth: number, gap: number) => {
  const totalAspect = row.reduce((sum, item) => sum + item.aspect, 0)
  const availableWidth = containerWidth - gap * Math.max(0, row.length - 1)

  return availableWidth > 0 && totalAspect > 0 ? availableWidth / totalAspect : 0
}

const pushRow = (
  rects: LayoutRect[],
  row: RowItem[],
  y: number,
  containerWidth: number,
  gap: number,
  targetHeight: number,
  dynamicFit: 'preserve' | 'crop',
  isLastRow: boolean,
) => {
  if (row.length === 0) {
    return 0
  }

  if (dynamicFit === 'crop') {
    const totalAspect = row.reduce((sum, item) => sum + item.aspect, 0)
    const availableWidth = Math.max(0, containerWidth - gap * Math.max(0, row.length - 1))
    let x = 0

    row.forEach((item, position) => {
      const isLastItem = position === row.length - 1
      const remainingWidth = Math.max(0, containerWidth - x)
      const width = isLastItem
        ? remainingWidth
        : totalAspect > 0
          ? (item.aspect / totalAspect) * availableWidth
          : availableWidth / row.length
      const crop: CropRect = coverCrop(item.aspect, width, targetHeight)

      rects.push({ index: item.index, x, y, width, height: targetHeight, crop })
      x += width + gap
    })

    return targetHeight
  }

  const fillHeight = rowFillHeight(row, containerWidth, gap)
  const height = isLastRow ? Math.min(fillHeight, targetHeight) : fillHeight
  let x = 0

  row.forEach((item) => {
    const width = item.aspect * height
    rects.push({ index: item.index, x, y, width, height, crop: FULL_CROP })
    x += width + gap
  })

  return height
}

/**
 * Computes a greedy justified photo layout similar to Flickr or Google Photos.
 *
 * Rows are filled in source order until adding another image would make the
 * aspect-preserving row height fall below the zoom-derived target. Preserve fit
 * keeps image aspect ratios, while crop fit uses fixed-height, width-balanced
 * rows with centered cover crops so every row fills the container width.
 */
export function justifiedLayout(input: LayoutInput): LayoutResult {
  const { items, containerWidth, settings } = input

  if (items.length === 0 || containerWidth <= 0) {
    return { rects: [], height: 0 }
  }

  const gap = normalizeGap(settings.gap)
  const targetHeight = targetRowHeightForZoom(settings.zoom)
  const rects: LayoutRect[] = []
  let row: RowItem[] = []
  let y = 0

  items.forEach((item, index) => {
    const nextItem = { index, aspect: aspectFor(item) }
    const candidate = [...row, nextItem]
    const candidateHeight = rowFillHeight(candidate, containerWidth, gap)

    if (row.length > 0 && candidateHeight < targetHeight) {
      const rowHeight = pushRow(
        rects,
        row,
        y,
        containerWidth,
        gap,
        targetHeight,
        settings.dynamicFit,
        false,
      )
      y += rowHeight + gap
      row = [nextItem]
      return
    }

    row = candidate
  })

  const lastRowHeight = pushRow(
    rects,
    row,
    y,
    containerWidth,
    gap,
    targetHeight,
    settings.dynamicFit,
    true,
  )

  return { rects, height: lastRowHeight > 0 ? y + lastRowHeight : 0 }
}
