/**
 * Loads a browser image element from an existing URL.
 *
 * @internal
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }

    image.src = url
  })
}
