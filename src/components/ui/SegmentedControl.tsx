import { useMemo, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useRovingRadioGroup } from '../../hooks/useRovingRadioGroup'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  /** Optional tooltip / accessible description. */
  title?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/**
 * An accessible segmented (radio-group) control used for enum-style settings.
 * Supports arrow-key/Home/End navigation per the WAI-ARIA radiogroup pattern.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const values = useMemo(() => options.map((o) => o.value), [options])
  const { setItemRef, handleKeyDown, tabIndexFor } = useRovingRadioGroup(values, value)

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-surface-2 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={setItemRef(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={tabIndexFor(opt.value)}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown(opt.value, onChange)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none',
              active ? 'bg-accent text-accent-text shadow' : 'text-text-muted hover:text-text',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
