import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  secondary: 'bg-surface-2 hover:bg-[#272b33] text-zinc-100 border border-border',
  ghost: 'text-zinc-300 hover:bg-surface-2 hover:text-white',
  danger: 'bg-red-600/90 hover:bg-red-600 text-white',
}

/** A small, theme-aware button with a few visual variants. */
export function Button({
  variant = 'secondary',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
