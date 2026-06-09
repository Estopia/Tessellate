import { type ReactNode } from 'react'
import { RotateCcw, X } from 'lucide-react'
import {
  ASPECT_RATIO_PRESETS,
  GAP_MAX,
  GAP_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type DynamicFit,
  type LayoutMode,
} from '../lib/layout'
import { useSettings } from '../state/SettingsContext'
import { cn } from '../lib/cn'
import { IconButton } from './ui/IconButton'
import { SegmentedControl, type SegmentOption } from './ui/SegmentedControl'
import { Slider } from './ui/Slider'

const MODES: SegmentOption<LayoutMode>[] = [
  { value: 'dynamic', label: 'Dynamic', title: 'Justified rows that fill the width' },
  { value: 'fixed', label: 'Fixed', title: 'Uniform grid with a fixed aspect ratio' },
  { value: 'masonry', label: 'Masonry', title: 'Balanced columns, no cropping' },
]

const FITS: SegmentOption<DynamicFit>[] = [
  { value: 'preserve', label: 'Preserve', title: 'Keep aspect ratios (no crop)' },
  { value: 'crop', label: 'Crop to fill', title: 'Uniform rows with flush edges' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h3>
      {children}
    </section>
  )
}

interface SettingsPanelProps {
  onClose?: () => void
}

/** The full settings panel — layout mode, mode-specific options, zoom and gap. */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, update, reset } = useSettings()

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Settings</h2>
        <div className="flex items-center gap-1">
          <IconButton label="Reset settings" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          {onClose && (
            <IconButton label="Close settings" className="lg:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <Section title="Layout mode">
          <SegmentedControl
            ariaLabel="Layout mode"
            options={MODES}
            value={settings.mode}
            onChange={(mode) => update({ mode })}
          />
        </Section>

        {settings.mode === 'dynamic' && (
          <Section title="Dynamic fit">
            <SegmentedControl
              ariaLabel="Dynamic fit"
              options={FITS}
              value={settings.dynamicFit}
              onChange={(dynamicFit) => update({ dynamicFit })}
            />
            <p className="text-xs text-zinc-500">
              {settings.dynamicFit === 'preserve'
                ? 'Rows keep every image’s aspect ratio.'
                : 'Rows are equal height with flush, cropped edges.'}
            </p>
          </Section>
        )}

        {settings.mode === 'fixed' && (
          <Section title="Aspect ratio">
            <div role="radiogroup" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1.5">
              {ASPECT_RATIO_PRESETS.map((preset) => {
                const active = settings.aspectRatio === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ aspectRatio: preset })}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-sm font-medium transition-colors',
                      'focus-visible:ring-accent-hover focus-visible:ring-2 focus-visible:outline-none',
                      active
                        ? 'border-accent bg-accent/15 text-white'
                        : 'border-border text-zinc-300 hover:text-white',
                    )}
                  >
                    {preset}
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        <Section title="Sizing">
          <Slider
            label="Zoom"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={settings.zoom}
            onChange={(zoom) => update({ zoom })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Gap"
            min={GAP_MIN}
            max={GAP_MAX}
            step={1}
            value={settings.gap}
            onChange={(gap) => update({ gap })}
            format={(v) => `${v}px`}
          />
        </Section>

        <p className="text-xs text-zinc-500">
          Tip: hold <kbd className="bg-surface-2 rounded px-1">Ctrl</kbd>/
          <kbd className="bg-surface-2 rounded px-1">⌘</kbd> and scroll, or pinch, over the grid to
          zoom.
        </p>
      </div>
    </div>
  )
}
