import { ImageUp } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'

interface DropzoneProps {
  onBrowse: () => void
  isDragging: boolean
}

/**
 * Full-area uploader shown when no images have been added yet. The actual drop
 * handling lives in the parent (via {@link useFileDrop}); this is the visual
 * affordance plus a browse button.
 */
export function Dropzone({ onBrowse, isDragging }: DropzoneProps) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <div
        className={cn(
          'flex max-w-md flex-col items-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors',
          isDragging ? 'border-accent bg-accent/5' : 'border-border',
        )}
      >
        <div className="mb-4 rounded-full bg-surface-2 p-4 text-accent">
          <ImageUp className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">Drop images to tessellate</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Drag &amp; drop a batch of images here, or browse to select. Everything stays in your
          browser — nothing is ever uploaded.
        </p>
        <Button variant="primary" className="mt-5" onClick={onBrowse}>
          Browse images
        </Button>
      </div>
    </div>
  )
}
