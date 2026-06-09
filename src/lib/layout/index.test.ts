import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'
import { fixedScaleLayout } from './fixedScale'
import { computeLayout } from './index'
import { justifiedLayout } from './justified'
import { masonryLayout } from './masonry'
import type { LayoutInput, LayoutMode } from './types'

const items = [
  { width: 400, height: 300 },
  { width: 300, height: 400 },
  { width: 0, height: 0 },
]

const inputFor = (mode: LayoutMode): LayoutInput => ({
  items,
  containerWidth: 500,
  settings: { ...DEFAULT_SETTINGS, mode, gap: 8, zoom: 0.4 },
})

describe('computeLayout', () => {
  it('routes dynamic mode to the justified layout', () => {
    const input = inputFor('dynamic')

    expect(computeLayout(input)).toEqual(justifiedLayout(input))
  })

  it('routes fixed mode to the fixed-scale layout', () => {
    const input = inputFor('fixed')

    expect(computeLayout(input)).toEqual(fixedScaleLayout(input))
  })

  it('routes masonry mode to the masonry layout', () => {
    const input = inputFor('masonry')

    expect(computeLayout(input)).toEqual(masonryLayout(input))
  })
})
