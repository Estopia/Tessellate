import { useEffect, useRef, type RefObject } from 'react'
import { ZOOM_MAX, ZOOM_MIN } from '../lib/layout'

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))

/**
 * Wire `Ctrl/⌘ + mouse wheel` and two-finger pinch gestures on the element
 * referenced by `ref` to adjust a normalised zoom level in [0, 1]. The settings
 * panel's zoom slider drives the same state, so gestures and the slider stay in
 * sync.
 *
 * @param ref     element to attach gesture listeners to (the gallery scroller)
 * @param zoom    current normalised zoom value
 * @param setZoom stable setter that receives the next clamped zoom value
 */
export function useZoom(
  ref: RefObject<HTMLElement | null>,
  zoom: number,
  setZoom: (zoom: number) => void,
): void {
  // Keep the latest zoom in a ref so gesture math can read it without
  // re-attaching listeners on every change. Synced via an effect so the ref is
  // never written during render.
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      // Prevent the browser's page-zoom while pinch-zooming the grid.
      e.preventDefault()
      setZoom(clampZoom(zoomRef.current - e.deltaY * 0.0015))
    }

    const pointers = new Map<number, PointerEvent>()
    let startDistance = 0
    let startZoom = 0

    const distance = () => {
      const pts = [...pointers.values()]
      if (pts.length < 2) return 0
      return Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      pointers.set(e.pointerId, e)
      if (pointers.size === 2) {
        startDistance = distance()
        startZoom = zoomRef.current
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, e)
      if (pointers.size === 2 && startDistance > 0) {
        e.preventDefault()
        const delta = (distance() - startDistance) / 600
        setZoom(clampZoom(startZoom + delta))
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) startDistance = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref, setZoom])
}
