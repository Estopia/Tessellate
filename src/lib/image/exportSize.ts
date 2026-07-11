export interface CanvasDimensionOptions {
  maxWidth?: number
  maxHeight?: number
}

export interface CanvasDimensions {
  /** Output canvas width in px, after scaling to fit browser canvas limits. */
  width: number
  /** Output canvas height in px, after scaling to fit browser canvas limits. */
  height: number
  /** The scale factor applied to the raw (containerWidth × layout height) box. */
  scale: number
}

/**
 * Computes the final export canvas size for a grid of the given raw
 * (unscaled) dimensions, applying the same clamp-to-browser-limits logic used
 * by {@link composeGridToBlob}. Shared so the export button can show an
 * accurate size *before* the user commits to exporting.
 */
export function computeCanvasDimensions(
  rawWidth: number,
  rawHeight: number,
  options: CanvasDimensionOptions = {},
): CanvasDimensions {
  const maxWidth = options.maxWidth ?? 4096
  const maxHeight = options.maxHeight ?? 16384
  const safeWidth = Math.max(rawWidth, 1)
  const safeHeight = Math.max(rawHeight, 1)
  const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight, 3)

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    scale,
  }
}
