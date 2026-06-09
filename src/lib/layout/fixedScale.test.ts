import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { fixedScaleLayout } from './fixedScale'
import type { CropRect, Dimensions } from './types'

const tolerance = 0.5

const items: Dimensions[] = [
  { width: 400, height: 300 },
  { width: 300, height: 300 },
  { width: 300, height: 400 },
  { width: 1600, height: 900 },
  { width: 900, height: 1600 },
  { width: 0, height: 0 },
  { width: 2, height: 1 },
  { width: 1, height: 2 },
]

const layout = (
  sourceItems: Dimensions[] = items,
  overrides: Partial<typeof DEFAULT_SETTINGS> = {},
  containerWidth = 600,
) =>
  fixedScaleLayout({
    items: sourceItems,
    containerWidth,
    settings: { ...DEFAULT_SETTINGS, mode: 'fixed', ...overrides },
  })

const expectCropValid = (crop: CropRect) => {
  expect(crop.sx).toBeGreaterThanOrEqual(0)
  expect(crop.sy).toBeGreaterThanOrEqual(0)
  expect(crop.sx + crop.sw).toBeLessThanOrEqual(1 + 1e-6)
  expect(crop.sy + crop.sh).toBeLessThanOrEqual(1 + 1e-6)
}

const firstRowColumnCount = (sourceItems: Dimensions[], zoom: number) => {
  const result = layout(sourceItems, { gap: 10, zoom })
  const firstY = result.rects[0].y

  return result.rects.filter((rect) => rect.y === firstY).length
}

describe('fixedScaleLayout', () => {
  it('creates identical cells with preserved indices and valid cover crops', () => {
    const result = layout(items, { aspectRatio: '4:3', gap: 10, zoom: 0 })
    const [first] = result.rects

    expect(result.rects).toHaveLength(items.length)
    expect(result.rects.map((rect) => rect.index)).toEqual(items.map((_, index) => index))

    result.rects.forEach((rect) => {
      expect(rect.width).toBeCloseTo(first.width, 5)
      expect(rect.height).toBeCloseTo(first.height, 5)
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(600 + tolerance)
      expectCropValid(rect.crop)
    })
  })

  it('respects horizontal and vertical gaps', () => {
    const result = layout(items, { aspectRatio: '1:1', gap: 10, zoom: 0 })
    const sameRow = result.rects.filter((rect) => rect.y === 0)
    const belowFirst = result.rects.find((rect) => rect.x === 0 && rect.y > 0)

    sameRow.slice(1).forEach((rect, index) => {
      const previous = sameRow[index]
      expect(rect.x - (previous.x + previous.width)).toBeCloseTo(10, 5)
    })
    expect(belowFirst?.y).toBeCloseTo(sameRow[0].height + 10, 5)
  })

  it('uses lower zoom for more columns and lower total height', () => {
    const lowZoom = layout(items, { aspectRatio: '1:1', gap: 10, zoom: 0 })
    const highZoom = layout(items, { aspectRatio: '1:1', gap: 10, zoom: 1 })

    expect(firstRowColumnCount(items, 0)).toBeGreaterThan(firstRowColumnCount(items, 1))
    expect(lowZoom.height).toBeLessThan(highZoom.height)
  })

  it('handles empty, single-image, and zero-width inputs', () => {
    expect(layout([])).toEqual({ rects: [], height: 0 })
    expect(layout([{ width: 1, height: 1 }]).rects).toHaveLength(1)
    expect(layout([{ width: 1, height: 1 }], {}, 0)).toEqual({ rects: [], height: 0 })
  })
})
