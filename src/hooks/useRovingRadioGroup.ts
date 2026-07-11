import { useCallback, useRef, type KeyboardEvent } from 'react'

/**
 * Roving-tabindex + arrow-key navigation for a horizontal `role="radio"`
 * group (WAI-ARIA radiogroup pattern: https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
 * Returns a ref callback to collect each option's button element, a keydown
 * handler to wire onto each button, and a helper to compute the correct
 * `tabIndex` for a given option (0 for the selected/first item, -1 otherwise).
 */
export function useRovingRadioGroup<T extends string>(options: readonly T[], value: T) {
  const itemRefs = useRef<Map<T, HTMLButtonElement>>(new Map())

  const setItemRef = useCallback(
    (option: T) => (el: HTMLButtonElement | null) => {
      if (el) itemRefs.current.set(option, el)
      else itemRefs.current.delete(option)
    },
    [],
  )

  const focusAndSelect = useCallback(
    (option: T, onChange: (value: T) => void) => {
      onChange(option)
      itemRefs.current.get(option)?.focus()
    },
    [],
  )

  const handleKeyDown = useCallback(
    (option: T, onChange: (value: T) => void) => (e: KeyboardEvent<HTMLButtonElement>) => {
      const index = options.indexOf(option)
      let nextIndex: number
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % options.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (index - 1 + options.length) % options.length
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = options.length - 1
          break
        default:
          return
      }
      e.preventDefault()
      focusAndSelect(options[nextIndex], onChange)
    },
    [options, focusAndSelect],
  )

  const tabIndexFor = useCallback((option: T) => (option === value ? 0 : -1), [value])

  return { setItemRef, handleKeyDown, tabIndexFor }
}
