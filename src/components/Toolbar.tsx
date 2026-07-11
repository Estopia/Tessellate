import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Download, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'

export type ExportFormat = 'image/png' | 'image/jpeg'

interface ToolbarProps {
  count: number
  isExporting: boolean
  onAdd: () => void
  onClear: () => void
  onExport: (format: ExportFormat) => void
}

const EXPORT_OPTIONS: { format: ExportFormat; primary: string; secondary: string }[] = [
  { format: 'image/png', primary: 'Grid as PNG', secondary: 'Lossless · transparent' },
  { format: 'image/jpeg', primary: 'Grid as JPG', secondary: 'Smaller file size' },
]

/** Header actions: image count, add, export (PNG/JPG menu) and clear. */
export function Toolbar({ count, isExporting, onAdd, onClear, onExport }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hasImages = count > 0
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const pick = (format: ExportFormat) => {
    setMenuOpen(false)
    onExport(format)
  }

  // Move focus onto the first menu item once it opens, per the WAI-ARIA menu pattern.
  useEffect(() => {
    if (menuOpen) itemRefs.current[0]?.focus()
  }, [menuOpen])

  const closeAndReturnFocus = () => {
    setMenuOpen(false)
    triggerRef.current?.focus()
  }

  const handleMenuKeyDown = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = EXPORT_OPTIONS.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        itemRefs.current[index === last ? 0 : index + 1]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        itemRefs.current[index === 0 ? last : index - 1]?.focus()
        break
      case 'Home':
        e.preventDefault()
        itemRefs.current[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        itemRefs.current[last]?.focus()
        break
      case 'Escape':
        e.preventDefault()
        closeAndReturnFocus()
        break
      case 'Tab':
        setMenuOpen(false)
        break
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted hidden text-sm sm:inline">
        {count} {count === 1 ? 'image' : 'images'}
      </span>

      <Button variant="secondary" icon={<ImagePlus className="h-4 w-4" />} onClick={onAdd}>
        <span className="hidden sm:inline">Add</span>
      </Button>

      <div className="relative">
        <Button
          ref={triggerRef}
          variant="primary"
          disabled={!hasImages || isExporting}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          icon={
            isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )
          }
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="hidden sm:inline">Export</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>

        {menuOpen && (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default"
              aria-hidden
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Export format"
              className="border-border bg-surface absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border shadow-xl"
            >
              {EXPORT_OPTIONS.map((opt, index) => (
                <MenuItem
                  key={opt.format}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => pick(opt.format)}
                  onKeyDown={handleMenuKeyDown(index)}
                  primary={opt.primary}
                  secondary={opt.secondary}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        disabled={!hasImages}
        icon={<Trash2 className="h-4 w-4" />}
        onClick={onClear}
      >
        <span className="hidden sm:inline">Clear</span>
      </Button>
    </div>
  )
}

function MenuItem({
  onClick,
  onKeyDown,
  primary,
  secondary,
  ref,
}: {
  onClick: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  primary: string
  secondary: string
  ref: (el: HTMLButtonElement | null) => void
}) {
  return (
    <button
      ref={ref}
      role="menuitem"
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="hover:bg-surface-2 focus-visible:bg-surface-2 block w-full px-3 py-2 text-left transition-colors focus-visible:outline-none"
    >
      <div className="text-text text-sm font-medium">{primary}</div>
      <div className="text-text-faint text-xs">{secondary}</div>
    </button>
  )
}

