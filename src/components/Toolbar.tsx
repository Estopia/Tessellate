import { useState } from 'react'
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

/** Header actions: image count, add, export (PNG/JPG menu) and clear. */
export function Toolbar({ count, isExporting, onAdd, onClear, onExport }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hasImages = count > 0

  const pick = (format: ExportFormat) => {
    setMenuOpen(false)
    onExport(format)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-zinc-400 sm:inline">
        {count} {count === 1 ? 'image' : 'images'}
      </span>

      <Button variant="secondary" icon={<ImagePlus className="h-4 w-4" />} onClick={onAdd}>
        <span className="hidden sm:inline">Add</span>
      </Button>

      <div className="relative">
        <Button
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
              className="border-border bg-surface absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border shadow-xl"
            >
              <MenuItem
                onClick={() => pick('image/png')}
                primary="Grid as PNG"
                secondary="Lossless · transparent"
              />
              <MenuItem
                onClick={() => pick('image/jpeg')}
                primary="Grid as JPG"
                secondary="Smaller file size"
              />
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
  primary,
  secondary,
}: {
  onClick: () => void
  primary: string
  secondary: string
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="hover:bg-surface-2 block w-full px-3 py-2 text-left transition-colors"
    >
      <div className="text-sm font-medium text-zinc-100">{primary}</div>
      <div className="text-xs text-zinc-500">{secondary}</div>
    </button>
  )
}
