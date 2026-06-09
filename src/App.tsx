import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, Maximize2, Minimize2, SlidersHorizontal } from 'lucide-react'
import { computeLayout, type ImageItem, type LayoutRect } from './lib/layout'
import { composeGridToBlob, cropImageToBlob, downloadBlob, suggestFilename } from './lib/image'
import { useImages } from './hooks/useImages'
import { useContainerWidth } from './hooks/useContainerWidth'
import { useFileDrop } from './hooks/useFileDrop'
import { useZoom } from './hooks/useZoom'
import { useSettings } from './state/SettingsContext'
import { Dropzone } from './components/Dropzone'
import { Gallery } from './components/Gallery'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar, type ExportFormat } from './components/Toolbar'
import { Lightbox } from './components/Lightbox'
import { IconButton } from './components/ui/IconButton'

export default function App() {
  const { images, isLoading, lastError, addFiles, removeImage, clearImages, reorderImages } =
    useImages()
  const { settings, update } = useSettings()
  const { isDragging, open, inputProps, dropHandlers } = useFileDrop(addFiles)
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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

  // Focus mode: `F` toggles hiding the chrome, `Esc` restores it (unless the
  // lightbox is open, which handles Esc itself). Ignored while typing in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing) return
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setFocusMode((v) => !v)
      } else if (e.key === 'Escape' && lightbox === null) {
        setFocusMode(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const handleDownloadOne = useCallback(async (image: ImageItem, rect: LayoutRect) => {
    try {
      const blob = await cropImageToBlob(image, rect.crop, { format: 'image/png' })
      downloadBlob(blob, suggestFilename(image.name, 'image/png'))
    } catch (err) {
      console.error('Failed to export image', err)
      setExportError('Could not export that image.')
    }
  }, [])

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
        })
        downloadBlob(blob, suggestFilename('tessellate-grid', format))
      } catch (err) {
        console.error('Failed to export grid', err)
        setExportError('Export failed — the grid may be too large. Try lowering zoom or removing images.')
      } finally {
        setIsExporting(false)
      }
    },
    [images, layout, width, settings.gap],
  )

  const hasImages = images.length > 0

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
              <span className="ml-2 hidden text-sm font-normal text-zinc-500 sm:inline">
                dynamic image grids
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://open.estopia.net"
              target="_blank"
              rel="noopener noreferrer"
              title="Estopia open-source projects (open.estopia.net)"
              className="hover:bg-surface-2 focus-visible:ring-accent-hover inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
            >
              <Boxes className="h-4 w-4" />
              <span className="hidden md:inline">open.estopia.net</span>
            </a>
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
            />
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        {!focusMode && (
          <aside className="border-border hidden w-80 shrink-0 overflow-hidden border-r lg:block">
            <SettingsPanel />
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
              <SettingsPanel onClose={() => setDrawerOpen(false)} />
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
              className="border-border bg-surface/80 hover:bg-surface-2 fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm text-zinc-200 shadow-lg backdrop-blur transition-colors"
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
                />
              ) : (
                <Dropzone onBrowse={open} isDragging={isDragging} />
              )}
            </div>
          </div>

          {isDragging && hasImages && (
            <div className="border-accent bg-accent/10 pointer-events-none absolute inset-0 z-30 m-2 flex items-center justify-center rounded-xl border-2 border-dashed">
              <span className="bg-surface rounded-lg px-4 py-2 text-sm font-medium text-zinc-100 shadow-lg">
                Drop to add images
              </span>
            </div>
          )}

          {isLoading && (
            <div className="bg-surface border-border absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1.5 text-sm text-zinc-300 shadow-lg">
              Decoding images…
            </div>
          )}

          {lastError && !isLoading && !exportError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-sm text-amber-200 shadow-lg">
              {lastError}
            </div>
          )}

          {exportError && (
            <button
              type="button"
              onClick={() => setExportError(null)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-sm text-red-200 shadow-lg"
            >
              {exportError} ✕
            </button>
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
    </div>
  )
}
