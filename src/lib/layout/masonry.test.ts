import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { masonryLayout } from './masonry'
import { FULL_CROP, type Dimensions } from './types'

const tolerance = 0.5

const items: Dimensions[] = [
  { width: 1, height: 1 },
  { width: 1, height: 2 },
  { width: 2, height: 1 },
  { width: 3, height: 2 },
  { width: 0, height: 0 },
  { width: 4, height: 3 },
]

const layout = (
  sourceItems: Dimensions[] = items,
  overrides: Partial<typeof DEFAULT_SETTINGS> = {},
  containerWidth = 600,
) =>
  masonryLayout({
    items: sourceItems,
    containerWidth,
    settings: { ...DEFAULT_SETTINGS, mode: 'masonry', ...overrides },
  })

const firstRowColumnCount = (sourceItems: Dimensions[], zoom: number) => {
  const result = layout(sourceItems, { gap: 10, zoom })

  return result.rects.filter((rect) => rect.y === 0).length
}

describe('masonryLayout', () => {
  it('preserves indices, fits columns within the container, and uses full crops', () => {
    const result = layout(items, { gap: 10, zoom: 0 })

    expect(result.rects).toHaveLength(items.length)
    expect(result.rects.map((rect) => rect.index)).toEqual(items.map((_, index) => index))
    expect(result.height).toBeGreaterThan(0)

    result.rects.forEach((rect) => {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(600 + tolerance)
      expect(rect.crop).toEqual(FULL_CROP)
    })
  })

  it('places each image into the currently shortest column with gaps', () => {
    const result = layout(
      [
        { width: 1, height: 1 },
        { width: 1, height: 1 },
        { width: 1, height: 1 },
      ],
      { gap: 15, zoom: 0 },
      330,
    )
    const [first, second, third] = result.rects

    expect(first.y).toBe(0)
    expect(second.y).toBe(0)
    expect(second.x - (first.x + first.width)).toBeCloseTo(15, 5)
    expect(third.x).toBeCloseTo(first.x, 5)
    expect(third.y - (first.y + first.height)).toBeCloseTo(15, 5)
  })

  it('uses lower zoom for more columns and lower total height', () => {
    const lowZoom = layout(items, { gap: 10, zoom: 0 })
    const highZoom = layout(items, { gap: 10, zoom: 1 })

    expect(firstRowColumnCount(items, 0)).toBeGreaterThan(firstRowColumnCount(items, 1))
    expect(lowZoom.height).toBeLessThan(highZoom.height)
  })

  it('handles empty, single-image, invalid-image, and zero-width inputs', () => {
    expect(layout([])).toEqual({ rects: [], height: 0 })
    expect(layout([{ width: 1, height: 1 }]).rects).toHaveLength(1)
    expect(layout([{ width: 0, height: 0 }]).rects[0].height).toBeGreaterThan(0)
    expect(layout([{ width: 1, height: 1 }], {}, 0)).toEqual({ rects: [], height: 0 })
  })
})
