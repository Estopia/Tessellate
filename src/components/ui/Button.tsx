import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-accent-text',
  secondary: 'bg-surface-2 hover:bg-border text-text border border-border',
  ghost: 'text-text-muted hover:bg-surface-2 hover:text-text',
  danger: 'bg-danger hover:bg-danger-hover text-white',
}

/** A small, theme-aware button with a few visual variants. */
export function Button({
  variant = 'secondary',
  icon,
  className,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
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
