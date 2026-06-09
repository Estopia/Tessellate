import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

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

/** An accessible segmented (radio-group) control used for enum-style settings. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
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
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none',
              active ? 'bg-accent text-white shadow' : 'text-zinc-300 hover:text-white',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
