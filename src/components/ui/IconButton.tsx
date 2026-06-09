import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (also used as the tooltip). */
  label: string
  children: ReactNode
}

/** A square, icon-only button with an accessible label. */
export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300',
        'transition-colors hover:bg-surface-2 hover:text-white',
        'focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
