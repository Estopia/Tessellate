import { type ChangeEvent, type ReactNode } from 'react'

interface SliderProps {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Optional formatter for the value read-out (e.g. `${v}px`). */
  format?: (value: number) => string
}

/** A labelled range slider with a live value read-out. */
export function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-200">{label}</span>
        <span className="tabular-nums text-zinc-400">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
