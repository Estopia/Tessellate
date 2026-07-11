import { X } from 'lucide-react'

interface ShortcutsHelpProps {
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: '?', description: 'Show/hide this shortcuts overlay' },
  { keys: 'F', description: 'Toggle focus mode (hide menus)' },
  { keys: 'Esc', description: 'Exit focus mode, close a dialog, or close the lightbox' },
  { keys: 'Ctrl/⌘ + scroll', description: 'Zoom the grid (or pinch on touch devices)' },
  { keys: '←/→', description: 'Previous/next image in the lightbox' },
  { keys: 'Ctrl/⌘ + V', description: 'Paste an image from the clipboard' },
  { keys: 'Arrow keys', description: 'Reorder the focused image (drag-and-drop alternative)' },
]

/** A `?`-triggered cheat sheet of keyboard shortcuts. */
export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div
        className="border-border bg-surface w-full max-w-md rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-text text-sm font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:bg-surface-2 hover:text-text grid h-8 w-8 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="space-y-2 p-4">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-text-muted">{s.description}</dt>
              <dd className="shrink-0">
                <kbd className="bg-surface-2 text-text rounded px-1.5 py-0.5 font-mono text-xs">
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
