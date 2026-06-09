import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { justifiedLayout } from './justified'
import { FULL_CROP, type CropRect, type Dimensions, type LayoutResult } from './types'

const tolerance = 0.5

const baseItems: Dimensions[] = [
  { width: 400, height: 300 },
  { width: 300, height: 300 },
  { width: 300, height: 400 },
  { width: 1600, height: 900 },
  { width: 900, height: 1600 },
  { width: 0, height: 0 },
]

const layout = (
  items: Dimensions[],
  overrides: Partial<typeof DEFAULT_SETTINGS> = {},
  containerWidth = 600,
) =>
  justifiedLayout({
    items,
    containerWidth,
    settings: { ...DEFAULT_SETTINGS, mode: 'dynamic', ...overrides },
  })

const rowsOf = (result: LayoutResult) =>
  result.rects.reduce<Array<typeof result.rects>>((rows, rect) => {
    const row = rows.find((candidate) => Math.abs(candidate[0].y - rect.y) < 1e-6)

    if (row) {
      row.push(rect)
    } else {
      rows.push([rect])
    }

    return rows
  }, [])

const expectCropValid = (crop: CropRect) => {
  expect(crop.sx).toBeGreaterThanOrEqual(0)
  expect(crop.sy).toBeGreaterThanOrEqual(0)
  expect(crop.sx + crop.sw).toBeLessThanOrEqual(1 + 1e-6)
  expect(crop.sy + crop.sh).toBeLessThanOrEqual(1 + 1e-6)
}

describe('justifiedLayout', () => {
  it('preserves rect count, source indices, container bounds, and full crops', () => {
    const result = layout(baseItems, { dynamicFit: 'preserve', gap: 10, zoom: 0.25 })

    expect(result.rects).toHaveLength(baseItems.length)
    expect(result.rects.map((rect) => rect.index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(result.height).toBeGreaterThan(0)

    rowsOf(result).forEach((row) => {
      row.forEach((rect) => {
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.x + rect.width).toBeLessThanOrEqual(600 + tolerance)
        expect(rect.crop).toEqual(FULL_CROP)
      })

      row.slice(1).forEach((rect, index) => {
        const previous = row[index]
        expect(rect.x - (previous.x + previous.width)).toBeCloseTo(10, 5)
      })
    })
  })

  it('does not stretch the final preserve row beyond the target height', () => {
    const result = layout(
      [
        { width: 1, height: 1 },
        { width: 1, height: 1 },
        { width: 1, height: 1 },
      ],
      { dynamicFit: 'preserve', gap: 10, zoom: 0 },
    )
    const onlyRow = rowsOf(result)[0]
    const rightEdge = onlyRow[onlyRow.length - 1].x + onlyRow[onlyRow.length - 1].width

    expect(onlyRow[0].height).toBeCloseTo(140, 5)
    expect(rightEdge).toBeLessThan(600 - tolerance)
  })

  it('uses lower zoom for denser, shorter justified rows', () => {
    const items = Array.from({ length: 8 }, () => ({ width: 1, height: 1 }))
    const lowZoom = layout(items, { dynamicFit: 'preserve', gap: 0, zoom: 0 })
    const highZoom = layout(items, { dynamicFit: 'preserve', gap: 0, zoom: 1 })

    expect(rowsOf(lowZoom)[0]).toHaveLength(4)
    expect(rowsOf(highZoom)[0]).toHaveLength(1)
    expect(lowZoom.height).toBeLessThan(highZoom.height)
  })

  it('crop fit gives every row target height, fills width, and returns valid crops', () => {
    const result = layout(
      Array.from({ length: 6 }, () => ({ width: 1, height: 1 })),
      { dynamicFit: 'crop', gap: 10, zoom: 0 },
    )
    const rows = rowsOf(result)

    expect(rows).toHaveLength(2)
    rows.forEach((row) => {
      const rightEdge = row[row.length - 1].x + row[row.length - 1].width

      row.forEach((rect) => {
        expect(rect.height).toBeCloseTo(140, 5)
        expectCropValid(rect.crop)
      })
      expect(rightEdge).toBeCloseTo(600, 5)
    })
    expect(result.height).toBeCloseTo(290, 5)
  })

  it('handles empty, single-image, invalid-image, and zero-width inputs', () => {
    expect(layout([])).toEqual({ rects: [], height: 0 })
    expect(layout([{ width: 1, height: 1 }]).rects).toHaveLength(1)
    expect(layout([{ width: 0, height: 0 }], { zoom: 0 }).rects[0].height).toBeCloseTo(140, 5)
    expect(layout([{ width: 1, height: 1 }], {}, 0)).toEqual({ rects: [], height: 0 })
  })
})
