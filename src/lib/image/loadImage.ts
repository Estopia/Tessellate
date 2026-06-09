/**
 * Creates an object URL for a file and resolves with its intrinsic dimensions.
 */
export function loadImage(
  file: File,
): Promise<{ url: string; naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({
        url,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image file: ${file.name}`))
    }

    image.src = url
  })
}

/**
 * Revokes a previously-created object URL.
 */
export function revokeImage(url: string): void {
  URL.revokeObjectURL(url)
}
