import { useCallback, useEffect, useMemo, useState } from 'react'
import { Maximize2, Minimize2, Monitor, Moon, SlidersHorizontal, Sun } from 'lucide-react'
import { adjustmentsToFilter, computeLayout, type ImageItem, type LayoutRect } from './lib/layout'
import {
  composeGridToBlob,
  computeCanvasDimensions,
  cropImageToBlob,
  downloadBlob,
  suggestFilename,
} from './lib/image'
import { useImages } from './hooks/useImages'
import { useContainerWidth } from './hooks/useContainerWidth'
import { useFileDrop } from './hooks/useFileDrop'
import { useSelection } from './hooks/useSelection'
import { useZoom } from './hooks/useZoom'
import { useSettings } from './state/SettingsContext'
import { useTheme } from './state/ThemeContext'
import { Dropzone } from './components/Dropzone'
import { Gallery } from './components/Gallery'
import { SettingsPanel } from './components/SettingsPanel'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { Toolbar, type ExportFormat } from './components/Toolbar'
import { Lightbox } from './components/Lightbox'
import { IconButton } from './components/ui/IconButton'
import { Toast } from './components/ui/Toast'

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const
const THEME_LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' } as const

export default function App() {
  const { settings, update } = useSettings()
  const {
    images,
    isLoading,
    lastError,
    clearLastError,
    addFiles,
    removeImage,
    removeImages,
    clearImages,
    reorderImages,
    rotateImage,
    flipImage,
    undo,
    canUndo,
    undoLabel,
  } = useImages(settings.persistImages)
  const { theme, cycleTheme } = useTheme()
  const { isDragging, open, inputProps, dropHandlers } = useFileDrop(addFiles)
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()
  const selection = useSelection()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const setZoom = useCallback((zoom: number) => update({ zoom }), [update])
  useZoom(containerRef, settings.zoom, setZoom)

  const dims = useMemo(
    () => images.map((i) => ({ width: i.naturalWidth, height: i.naturalHeight })),
    [images],
  )
  const layout = useMemo(
    () => computeLayout({ items: dims, containerWidth: width, settings }),
    [dims, width, settings],
  )
  const exportDimensions = useMemo(() => {
    if (images.length === 0 || width === 0) return null
    return computeCanvasDimensions(width, layout.height)
  }, [images.length, width, layout.height])

  // Focus mode: `F` toggles hiding the chrome, `Esc` restores it (unless the
  // lightbox is open, which handles Esc itself). `?` toggles the shortcuts
  // overlay. Ignored while typing in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing) return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShortcutsOpen((v) => !v)
        return
      }
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setFocusMode((v) => !v)
      } else if (e.key === 'Escape' && lightbox === null) {
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (selectionMode) {
          setSelectionMode(false)
          selection.clear()
        } else {
          setFocusMode(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, shortcutsOpen, selectionMode, selection])

  // Paste an image straight from the clipboard (e.g. a screenshot).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        void addFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((v) => {
      if (v) selection.clear()
      return !v
    })
  }, [selection])

  const handleBulkRemove = useCallback(() => {
    removeImages(Array.from(selection.selected))
    selection.clear()
  }, [removeImages, selection])

  const handleBulkDownload = useCallback(async () => {
    const rectById = new Map(layout.rects.map((rect) => [images[rect.index]?.id, rect]))
    const filter = adjustmentsToFilter(settings.adjustments)
    const ids = Array.from(selection.selected)
    let n = 1
    for (const id of ids) {
      const image = images.find((i) => i.id === id)
      const rect = rectById.get(id)
      if (!image || !rect) continue
      try {
        const blob = await cropImageToBlob(image, rect.crop, { format: 'image/png', filter })
        downloadBlob(blob, suggestFilename(`tessellate-${n}-${image.name}`, 'image/png'))
      } catch (err) {
        console.error('Failed to export selected image', err)
      }
      n++
    }
  }, [images, layout, selection.selected, settings.adjustments])

  const handleDownloadOne = useCallback(
    async (image: ImageItem, rect: LayoutRect) => {
      try {
        const blob = await cropImageToBlob(image, rect.crop, {
          format: 'image/png',
          filter: adjustmentsToFilter(settings.adjustments),
        })
        downloadBlob(blob, suggestFilename(image.name, 'image/png'))
      } catch (err) {
        console.error('Failed to export image', err)
        setExportError('Could not export that image.')
      }
    },
    [settings.adjustments],
  )

  const handleExportGrid = useCallback(
    async (format: ExportFormat) => {
      if (images.length === 0 || width === 0) return
      setIsExporting(true)
      setExportError(null)
      try {
        const blob = await composeGridToBlob(images, layout, width, {
          gap: settings.gap,
          format,
          background: format === 'image/jpeg' ? '#0b0c0f' : 'transparent',
          filter: adjustmentsToFilter(settings.adjustments),
        })
        downloadBlob(blob, suggestFilename('tessellate-grid', format))
      } catch (err) {
        console.error('Failed to export grid', err)
        setExportError('Export failed — the grid may be too large. Try lowering zoom or removing images.')
      } finally {
        setIsExporting(false)
      }
    },
    [images, layout, width, settings.gap, settings.adjustments],
  )

  const hasImages = images.length > 0
  const ThemeIcon = THEME_ICON[theme]

  return (
    <div className="flex h-full flex-col">
      <input {...inputProps} />

      {!focusMode && (
        <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <IconButton
              label="Open settings"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </IconButton>
            <h1 className="text-base font-semibold tracking-tight">
              <span className="text-accent">Tessellate</span>
              <span className="text-text-faint ml-2 hidden text-sm font-normal sm:inline">
                dynamic image grids
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label={`${THEME_LABEL[theme]} (click to change)`} onClick={cycleTheme}>
              <ThemeIcon className="h-5 w-5" />
            </IconButton>
            <IconButton
              label="Hide menus (focus mode)"
              onClick={() => {
                setFocusMode(true)
                setDrawerOpen(false)
              }}
            >
              <Maximize2 className="h-5 w-5" />
            </IconButton>
            <Toolbar
              count={images.length}
              isExporting={isExporting}
              onAdd={open}
              onClear={clearImages}
              onExport={handleExportGrid}
              exportDimensions={exportDimensions}
              selectionMode={selectionMode}
              onToggleSelectionMode={toggleSelectionMode}
              selectionCount={selection.size}
              onSelectAll={() => selection.selectAll(images.map((i) => i.id))}
              onClearSelection={selection.clear}
              onBulkRemove={handleBulkRemove}
              onBulkDownload={handleBulkDownload}
            />
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        {!focusMode && (
          <aside className="border-border hidden w-80 shrink-0 overflow-hidden border-r lg:block">
            <SettingsPanel onShowShortcuts={() => setShortcutsOpen(true)} />
          </aside>
        )}

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Close settings"
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="border-border bg-surface absolute top-0 left-0 h-full w-80 max-w-[85%] border-r">
              <SettingsPanel
                onClose={() => setDrawerOpen(false)}
                onShowShortcuts={() => setShortcutsOpen(true)}
              />
            </aside>
          </div>
        )}

        <main {...dropHandlers} className="relative min-h-0 flex-1 overflow-y-auto">
          {focusMode && (
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              aria-label="Show menus"
              title="Show menus (Esc)"
              className="border-border bg-surface/80 hover:bg-surface-2 text-text fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm shadow-lg backdrop-blur transition-colors"
            >
              <Minimize2 className="h-4 w-4" /> Menus
            </button>
          )}
          <div className="p-4">
            <div ref={containerRef} className="w-full">
              {hasImages ? (
                <Gallery
                  images={images}
                  layout={layout}
                  onReorder={reorderImages}
                  onRemove={removeImage}
                  onDownload={handleDownloadOne}
                  onOpen={setLightbox}
                  onRotate={rotateImage}
                  onFlip={flipImage}
                  selectionMode={selectionMode}
                  isSelected={selection.isSelected}
                  onToggleSelect={selection.toggle}
                />
              ) : (
                <Dropzone onBrowse={open} isDragging={isDragging} />
              )}
            </div>
          </div>

          {isDragging && hasImages && (
            <div className="border-accent bg-accent/10 pointer-events-none absolute inset-0 z-30 m-2 flex items-center justify-center rounded-xl border-2 border-dashed">
              <span className="bg-surface text-text rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                Drop to add images
              </span>
            </div>
          )}

          {isLoading && <Toast variant="loading">Decoding images…</Toast>}

          {!isLoading && canUndo && (
            <Toast variant="warning" action={{ label: 'Undo', onClick: undo }}>
              {undoLabel}
            </Toast>
          )}

          {!isLoading && !canUndo && lastError && !exportError && (
            <Toast variant="warning" onDismiss={clearLastError}>
              {lastError}
            </Toast>
          )}

          {exportError && (
            <Toast variant="error" onDismiss={() => setExportError(null)}>
              {exportError}
            </Toast>
          )}
        </main>
      </div>

      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}

      {shortcutsOpen && <ShortcutsHelp onClose={() => setShortcutsOpen(false)} />}
    </div>
  )
}
