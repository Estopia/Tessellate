import { type ReactNode } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ToastVariant = 'loading' | 'warning' | 'error'

interface ToastProps {
  variant: ToastVariant
  children: ReactNode
  /** If provided, renders a dismiss (✕) button. Loading toasts have none — they clear themselves. */
  onDismiss?: () => void
  /** Optional secondary action, e.g. "Undo". */
  action?: { label: string; onClick: () => void }
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  loading: 'border-border bg-surface text-text-muted',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  error: 'border-danger/40 bg-danger/10 text-danger',
}

/**
 * A single, consistent bottom-of-screen status pill. Every non-loading toast
 * is dismissible the same way (an explicit ✕ button), instead of the previous
 * ad-hoc mix of a plain div and a click-anywhere-to-dismiss button.
 */
export function Toast({ variant, children, onDismiss, action }: ToastProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-lg',
        VARIANT_STYLES[variant],
      )}
    >
      {variant === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      <span>{children}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-full px-1.5 py-0.5 font-semibold underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="hover:bg-surface-2/60 -mr-1 grid h-6 w-6 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
