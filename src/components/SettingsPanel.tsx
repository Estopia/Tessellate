import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Boxes, Check, HelpCircle, RotateCcw, X } from 'lucide-react'
import {
  ADJUSTMENT_MAX,
  ADJUSTMENT_MIN,
  ASPECT_RATIO_PRESETS,
  CUSTOM_ASPECT_MAX,
  CUSTOM_ASPECT_MIN,
  GAP_MAX,
  GAP_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type AspectRatioPreset,
  type DynamicFit,
  type LayoutMode,
} from '../lib/layout'
import { useSettings } from '../state/SettingsContext'
import { usePresets } from '../hooks/usePresets'
import { cn } from '../lib/cn'
import { useRovingRadioGroup } from '../hooks/useRovingRadioGroup'
import { Button } from './ui/Button'
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

const ASPECT_OPTIONS: AspectRatioPreset[] = [...ASPECT_RATIO_PRESETS, 'custom']

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-text-muted text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  )
}

interface SettingsPanelProps {
  onClose?: () => void
  onShowShortcuts?: () => void
}

/** The full settings panel — layout mode, mode-specific options, zoom and gap. */
export function SettingsPanel({ onClose, onShowShortcuts }: SettingsPanelProps) {
  const { settings, update, reset } = useSettings()
  const { presets, savePreset, deletePreset } = usePresets()
  const [presetName, setPresetName] = useState('')
  const { setItemRef, handleKeyDown, tabIndexFor } = useRovingRadioGroup(
    useMemo(() => ASPECT_OPTIONS as readonly string[], []),
    settings.aspectRatio,
  )

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    savePreset(presetName, settings)
    setPresetName('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-text text-sm font-semibold">Settings</h2>
        <div className="flex items-center gap-1">
          {onShowShortcuts && (
            <IconButton label="Keyboard shortcuts" onClick={onShowShortcuts}>
              <HelpCircle className="h-4 w-4" />
            </IconButton>
          )}
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
            <p className="text-text-muted text-xs">
              {settings.dynamicFit === 'preserve'
                ? 'Rows keep every image’s aspect ratio.'
                : 'Rows are equal height with flush, cropped edges.'}
            </p>
          </Section>
        )}

        {settings.mode === 'fixed' && (
          <Section title="Aspect ratio">
            <div role="radiogroup" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1.5">
              {ASPECT_OPTIONS.map((preset) => {
                const active = settings.aspectRatio === preset
                return (
                  <button
                    key={preset}
                    ref={setItemRef(preset)}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={tabIndexFor(preset)}
                    onClick={() => update({ aspectRatio: preset })}
                    onKeyDown={handleKeyDown(preset, (v) =>
                      update({ aspectRatio: v as typeof preset }),
                    )}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors capitalize',
                      'focus-visible:ring-accent-hover focus-visible:ring-2 focus-visible:outline-none',
                      active
                        ? 'border-accent bg-accent/15 text-text'
                        : 'border-border text-text-muted hover:text-text',
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5 text-accent" aria-hidden />}
                    {preset}
                  </button>
                )
              })}
            </div>

            {settings.aspectRatio === 'custom' && (
              <div className="flex items-center gap-2">
                <label className="flex-1 text-xs">
                  <span className="text-text-muted mb-1 block">Width</span>
                  <input
                    type="number"
                    min={CUSTOM_ASPECT_MIN}
                    max={CUSTOM_ASPECT_MAX}
                    value={settings.customAspectRatio.w}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update({
                        customAspectRatio: {
                          ...settings.customAspectRatio,
                          w: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="border-border bg-surface-2 text-text w-full rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
                  />
                </label>
                <span className="text-text-faint mt-4">:</span>
                <label className="flex-1 text-xs">
                  <span className="text-text-muted mb-1 block">Height</span>
                  <input
                    type="number"
                    min={CUSTOM_ASPECT_MIN}
                    max={CUSTOM_ASPECT_MAX}
                    value={settings.customAspectRatio.h}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      update({
                        customAspectRatio: {
                          ...settings.customAspectRatio,
                          h: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="border-border bg-surface-2 text-text w-full rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
                  />
                </label>
              </div>
            )}
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

        <Section title="Adjustments">
          <Slider
            label="Brightness"
            min={ADJUSTMENT_MIN}
            max={ADJUSTMENT_MAX}
            value={settings.adjustments.brightness}
            onChange={(brightness) => update({ adjustments: { ...settings.adjustments, brightness } })}
            format={(v) => `${v}%`}
          />
          <Slider
            label="Contrast"
            min={ADJUSTMENT_MIN}
            max={ADJUSTMENT_MAX}
            value={settings.adjustments.contrast}
            onChange={(contrast) => update({ adjustments: { ...settings.adjustments, contrast } })}
            format={(v) => `${v}%`}
          />
          <Slider
            label="Saturation"
            min={ADJUSTMENT_MIN}
            max={ADJUSTMENT_MAX}
            value={settings.adjustments.saturate}
            onChange={(saturate) => update({ adjustments: { ...settings.adjustments, saturate } })}
            format={(v) => `${v}%`}
          />
          <p className="text-text-muted text-xs">Applied to every image, in preview and export.</p>
        </Section>

        <Section title="Presets">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              placeholder="Preset name"
              aria-label="New preset name"
              className="border-border bg-surface-2 text-text placeholder:text-text-faint w-full rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
            />
            <Button variant="secondary" onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save
            </Button>
          </div>
          {presets.length > 0 && (
            <ul className="space-y-1">
              {presets.map((preset) => (
                <li
                  key={preset.id}
                  className="border-border flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => update(preset.settings)}
                    className="text-text hover:text-accent flex-1 truncate text-left text-sm focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
                  >
                    {preset.name}
                  </button>
                  <IconButton label={`Delete preset ${preset.name}`} onClick={() => deletePreset(preset.id)}>
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Privacy">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.persistImages}
              onChange={(e) => update({ persistImages: e.target.checked })}
              className="accent-accent mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-text-muted">
              Keep images between reloads (stored only in this browser). Off by default — turning
              this off again immediately deletes anything saved.
            </span>
          </label>
        </Section>

        <p className="text-text-muted text-xs">
          Tip: hold <kbd className="bg-surface-2 rounded px-1">Ctrl</kbd>/
          <kbd className="bg-surface-2 rounded px-1">⌘</kbd> and scroll, or pinch, over the grid to
          zoom. Press <kbd className="bg-surface-2 rounded px-1">?</kbd> for all keyboard
          shortcuts.
        </p>
      </div>

      <div className="border-border border-t px-4 py-3">
        <a
          href="https://open.estopia.net"
          target="_blank"
          rel="noopener noreferrer"
          title="Estopia open-source projects (open.estopia.net)"
          className="text-text-faint hover:text-text-muted inline-flex items-center gap-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:outline-none"
        >
          <Boxes className="h-3.5 w-3.5" aria-hidden />
          open.estopia.net
        </a>
      </div>
    </div>
  )
}

