/**
 * Shared layout types.
 *
 * These types form the contract between the pure layout algorithms
 * (`src/lib/layout`), the image/canvas utilities (`src/lib/image`), and the
 * React UI. The layout algorithms are intentionally framework-agnostic: they
 * take plain dimensions + settings and return positioned rectangles, so they
 * can be unit-tested in isolation and reused for both DOM rendering and
 * canvas export.
 */

/** A user-uploaded image plus the metadata we need to render and export it. */
export interface ImageItem {
  /** Stable unique id (used as React key and dnd-kit sortable id). */
  id: string
  /** Object URL (`blob:`) used for in-browser rendering. */
  url: string
  /** The original File handle, kept so exports can use full resolution. */
  file: File
  /** Original file name (for individual-image downloads). */
  name: string
  /** Intrinsic pixel width of the source image. */
  naturalWidth: number
  /** Intrinsic pixel height of the source image. */
  naturalHeight: number
}

/** The available grid layout algorithms. */
export type LayoutMode = 'dynamic' | 'fixed' | 'masonry'

/** Sub-behaviour for the Dynamic Fit mode. */
export type DynamicFit = 'preserve' | 'crop'

/** Supported Fixed Scale aspect ratios, expressed as `width:height`. */
export type AspectRatioPreset = '1:1' | '4:3' | '3:2' | '16:9' | '3:4' | '2:3'

/** All user-tunable layout settings (persisted to localStorage). */
export interface LayoutSettings {
  /** Active layout algorithm. */
  mode: LayoutMode
  /** Dynamic Fit: preserve aspect ratios vs crop-to-fill flush rows. */
  dynamicFit: DynamicFit
  /** Aspect ratio used by Fixed Scale mode. */
  aspectRatio: AspectRatioPreset
  /** Gap between images, in CSS pixels. */
  gap: number
  /**
   * Normalised zoom/density level in the range [0, 1].
   * Higher = fewer, larger images; lower = more, smaller images.
   * Each algorithm maps this to its own parameter (row height / columns).
   */
  zoom: number
}

/**
 * Normalised crop rectangle, expressed as fractions [0, 1] of the *source*
 * image. Used both for CSS `object-position` in the DOM and for the source
 * rectangle when drawing to an export canvas.
 */
export interface CropRect {
  /** Left edge as a fraction of source width. */
  sx: number
  /** Top edge as a fraction of source height. */
  sy: number
  /** Width as a fraction of source width. */
  sw: number
  /** Height as a fraction of source height. */
  sh: number
}

/** A `CropRect` that selects the entire source image (no cropping). */
export const FULL_CROP: CropRect = { sx: 0, sy: 0, sw: 1, sh: 1 }

/** A positioned, sized rectangle for one image within the computed layout. */
export interface LayoutRect {
  /** Index of the image in the source array. */
  index: number
  /** Left offset in px, relative to the container. */
  x: number
  /** Top offset in px, relative to the container. */
  y: number
  /** Rendered width in px. */
  width: number
  /** Rendered height in px. */
  height: number
  /** Crop applied to fit the source image into {width, height}. */
  crop: CropRect
}

/** The result of a layout computation for a given container width. */
export interface LayoutResult {
  /** Positioned rectangles, in source order. */
  rects: LayoutRect[]
  /** Total laid-out height in px (the width is the input container width). */
  height: number
}

/** Intrinsic size of a single image, decoupled from {@link ImageItem}. */
export interface Dimensions {
  width: number
  height: number
}

/** Inputs shared by every layout algorithm and the dispatcher. */
export interface LayoutInput {
  /** Intrinsic dimensions of each image, in source order. */
  items: Dimensions[]
  /** Available container width in px. */
  containerWidth: number
  /** Current layout settings. */
  settings: LayoutSettings
}

/** Signature implemented by each pure layout algorithm. */
export type LayoutFn = (input: LayoutInput) => LayoutResult
