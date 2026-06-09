import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Track the content-box width of an element via `ResizeObserver`, so the grid
 * can recompute its layout whenever the container changes size (window resize,
 * sidebar toggle, device rotation).
 *
 * @returns a tuple of `[ref, width]` — attach `ref` to the element to measure.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>(): [
  RefObject<T | null>,
  number,
] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setWidth(el.clientWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
