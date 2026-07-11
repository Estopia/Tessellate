import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { LayoutSettings } from '../lib/layout'

export interface LayoutPreset {
  id: string
  name: string
  settings: LayoutSettings
}

const PRESETS_STORAGE_KEY = 'tessellate:presets'

let idCounter = 0
const nextId = () => `preset_${Date.now().toString(36)}_${(idCounter++).toString(36)}`

export interface UsePresetsResult {
  presets: LayoutPreset[]
  /** Saves the given settings as a new named preset. */
  savePreset: (name: string, settings: LayoutSettings) => void
  /** Removes a saved preset. */
  deletePreset: (id: string) => void
}

/** Persists named, reusable snapshots of {@link LayoutSettings} (mode, zoom, gap, aspect ratio, ...). */
export function usePresets(): UsePresetsResult {
  const [presets, setPresets] = useLocalStorage<LayoutPreset[]>(PRESETS_STORAGE_KEY, [])

  const savePreset = useCallback(
    (name: string, settings: LayoutSettings) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setPresets((prev) => [...prev, { id: nextId(), name: trimmed, settings }])
    },
    [setPresets],
  )

  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => prev.filter((p) => p.id !== id))
    },
    [setPresets],
  )

  return { presets, savePreset, deletePreset }
}
