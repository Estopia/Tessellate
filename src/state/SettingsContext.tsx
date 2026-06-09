/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type LayoutSettings } from '../lib/layout'

interface SettingsContextValue {
  settings: LayoutSettings
  /** Merge a partial patch into the current settings. */
  update: (patch: Partial<LayoutSettings>) => void
  /** Restore the default settings. */
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/**
 * Provides the persisted {@link LayoutSettings} to the tree. Settings (and only
 * settings — never images) are stored in localStorage so they survive reloads.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, reset] = useLocalStorage<LayoutSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_SETTINGS,
  )

  const update = useCallback(
    (patch: Partial<LayoutSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings],
  )

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/** Access the layout settings and their updaters. */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
