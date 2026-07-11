import type { AspectRatioPreset, ImageAdjustments, LayoutSettings } from './types'

/** Numeric width / height value for each concrete aspect-ratio preset (excludes 'custom'). */
export const ASPECT_RATIOS: Record<Exclude<AspectRatioPreset, 'custom'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
}

/** Ordered list of concrete presets for building UI menus ('custom' is handled separately). */
export const ASPECT_RATIO_PRESETS = Object.keys(ASPECT_RATIOS) as Exclude<
  AspectRatioPreset,
  'custom'
>[]

/** Bounds for the custom aspect-ratio W/H number inputs. */
export const CUSTOM_ASPECT_MIN = 1
export const CUSTOM_ASPECT_MAX = 100

/** Gap slider bounds, in CSS pixels. */
export const GAP_MIN = 0
export const GAP_MAX = 48

/** Zoom slider bounds. Zoom is normalised to [0, 1]. */
export const ZOOM_MIN = 0
export const ZOOM_MAX = 1
export const ZOOM_STEP = 0.05

/** Bounds for the brightness/contrast/saturation adjustment sliders, in percent. */
export const ADJUSTMENT_MIN = 50
export const ADJUSTMENT_MAX = 150

/** Adjustment values that represent "no change" — used as the default and to skip CSS/canvas filters. */
export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
}

/**
 * Default settings used on first load, before any persisted state is read.
 * Dynamic Fit with preserved aspect ratios is the most forgiving default.
 */
export const DEFAULT_SETTINGS: LayoutSettings = {
  mode: 'dynamic',
  dynamicFit: 'preserve',
  aspectRatio: '1:1',
  customAspectRatio: { w: 1, h: 1 },
  gap: 8,
  zoom: 0.5,
  adjustments: DEFAULT_ADJUSTMENTS,
  persistImages: false,
}

/** localStorage key under which {@link LayoutSettings} are persisted. */
export const SETTINGS_STORAGE_KEY = 'tessellate:settings'
