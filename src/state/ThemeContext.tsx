/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type ThemePreference = 'light' | 'dark' | 'system'
type EffectiveTheme = 'light' | 'dark'

/** Kept in sync with the inline bootstrap script in index.html. */
const THEME_STORAGE_KEY = 'tessellate:theme'

interface ThemeContextValue {
  /** The user's stored preference (may be 'system'). */
  theme: ThemePreference
  /** The theme actually applied ('system' resolved to light/dark). */
  effectiveTheme: EffectiveTheme
  setTheme: (theme: ThemePreference) => void
  /** Cycles system -> light -> dark -> system, for a single toggle button. */
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Provides the light/dark/system theme preference, separate from
 * {@link SettingsContext} — theme is a UI preference, not an export-affecting
 * layout setting. Applies `data-theme` on `<html>` (also set synchronously by
 * an inline script in index.html to avoid a flash of the wrong theme).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemePreference>(THEME_STORAGE_KEY, 'system')
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme)

  useEffect(() => {
    if (!window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystemTheme(mql.matches ? 'light' : 'dark')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const effectiveTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }, [effectiveTheme])

  const cycleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'))
  }, [setTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, effectiveTheme, setTheme, cycleTheme }),
    [theme, effectiveTheme, setTheme, cycleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Access the current theme preference and its updaters. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
