import { useCallback, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
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

  const handleDownloadOne = useCallback(async (image: ImageItem, rect: LayoutRect) => {
    try {
      const blob = await cropImageToBlob(image, rect.crop, { format: 'image/png' })
      downloadBlob(blob, suggestFilename(image.name, 'image/png'))
    } catch (err) {
      console.error('Failed to export image', err)
    }
  }, [])

  const handleExportGrid = useCallback(
    async (format: ExportFormat) => {
      if (images.length === 0 || width === 0) return
      setIsExporting(true)
      try {
        const blob = await composeGridToBlob(images, layout, width, {
          gap: settings.gap,
          format,
          background: format === 'image/jpeg' ? '#0b0c0f' : 'transparent',
        })
        downloadBlob(blob, suggestFilename('tessellate-grid', format))
      } catch (err) {
        console.error('Failed to export grid', err)
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
        <Toolbar
          count={images.length}
          isExporting={isExporting}
          onAdd={open}
          onClear={clearImages}
          onExport={handleExportGrid}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="border-border hidden w-80 shrink-0 overflow-hidden border-r lg:block">
          <SettingsPanel />
        </aside>

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

          {lastError && !isLoading && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-sm text-amber-200 shadow-lg">
              {lastError}
            </div>
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
