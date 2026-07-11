import { useCallback, useMemo, useState } from 'react'

export interface UseSelectionResult {
  selected: ReadonlySet<string>
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  clear: () => void
  size: number
}

/** Tracks a set of selected image ids for multi-select bulk actions. */
export function useSelection(): UseSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids))
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  return useMemo(
    () => ({ selected, isSelected, toggle, selectAll, clear, size: selected.size }),
    [selected, isSelected, toggle, selectAll, clear],
  )
}
