import type { LayoutInput, LayoutResult } from './types'
import { fixedScaleLayout } from './fixedScale'
import { justifiedLayout } from './justified'
import { masonryLayout } from './masonry'

/**
 * Dispatches layout calculation to the algorithm selected by settings.mode.
 *
 * Dynamic mode uses greedy justified rows, fixed mode uses uniform aspect-ratio
 * cells, and masonry mode stacks preserved-aspect images into shortest columns.
 */
export function computeLayout(input: LayoutInput): LayoutResult {
  switch (input.settings.mode) {
    case 'fixed':
      return fixedScaleLayout(input)
    case 'masonry':
      return masonryLayout(input)
    case 'dynamic':
    default:
      return justifiedLayout(input)
  }
}

export { fixedScaleLayout } from './fixedScale'
export { justifiedLayout } from './justified'
export { masonryLayout } from './masonry'
export * from './types'
export * from './constants'
export * from './util'
