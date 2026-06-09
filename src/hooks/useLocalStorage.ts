import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw) as unknown
    // Merge onto the fallback for objects so newly-added fields keep defaults.
    if (isPlainObject(fallback) && isPlainObject(parsed)) {
      return { ...fallback, ...parsed } as T
    }
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Persist a JSON-serialisable value in `localStorage`, keeping React state and
 * storage in sync. Resilient to unavailable storage (e.g. private mode) and to
 * malformed persisted data, both of which fall back to `initialValue`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(() => readStorage(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write failures (storage full or unavailable).
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, reset]
}
