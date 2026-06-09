/**
 * Triggers a browser download for a blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * Returns the standard file extension for an image MIME type.
 */
export function extensionForFormat(format: string): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/png':
    default:
      return 'png'
  }
}

/**
 * Suggests a filename with an extension matching the requested image format.
 */
export function suggestFilename(base: string, format: string): string {
  return `${base.replace(/\.[^./\\]+$/, '')}.${extensionForFormat(format)}`
}
