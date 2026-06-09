import type { AspectRatioPreset, LayoutSettings } from './types'

/** Numeric width / height value for each aspect-ratio preset. */
export const ASPECT_RATIOS: Record<AspectRatioPreset, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
}

/** Ordered list of presets for building UI menus. */
export const ASPECT_RATIO_PRESETS = Object.keys(ASPECT_RATIOS) as AspectRatioPreset[]

/** Gap slider bounds, in CSS pixels. */
export const GAP_MIN = 0
export const GAP_MAX = 48

/** Zoom slider bounds. Zoom is normalised to [0, 1]. */
export const ZOOM_MIN = 0
export const ZOOM_MAX = 1
export const ZOOM_STEP = 0.05

/**
 * Default settings used on first load, before any persisted state is read.
 * Dynamic Fit with preserved aspect ratios is the most forgiving default.
 */
export const DEFAULT_SETTINGS: LayoutSettings = {
  mode: 'dynamic',
  dynamicFit: 'preserve',
  aspectRatio: '1:1',
  gap: 8,
  zoom: 0.5,
}

/** localStorage key under which {@link LayoutSettings} are persisted. */
export const SETTINGS_STORAGE_KEY = 'tessellate:settings'
