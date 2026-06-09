import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from 'react'

export interface FileDrop {
  /** True while files are being dragged over the drop target. */
  isDragging: boolean
  /** Programmatically open the native file picker. */
  open: () => void
  /** Spread onto a hidden `<input type="file">`. */
  inputProps: {
    ref: RefObject<HTMLInputElement | null>
    type: 'file'
    multiple: boolean
    accept: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    className: string
  }
  /** Spread onto the element that should accept dropped files. */
  dropHandlers: {
    onDragEnter: (e: DragEvent<HTMLElement>) => void
    onDragOver: (e: DragEvent<HTMLElement>) => void
    onDragLeave: (e: DragEvent<HTMLElement>) => void
    onDrop: (e: DragEvent<HTMLElement>) => void
  }
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

/**
 * Encapsulates HTML5 drag-and-drop + file-input logic for uploading images.
 * Uses a depth counter so nested children don't cause the drag overlay to
 * flicker on `dragleave`.
 */
export function useFileDrop(onFiles: (files: FileList | File[]) => void): FileDrop {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const depth = useRef(0)

  const onDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    depth.current += 1
    setIsDragging(true)
  }, [])

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    depth.current -= 1
    if (depth.current <= 0) {
      depth.current = 0
      setIsDragging(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      depth.current = 0
      setIsDragging(false)
      if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files)
    },
    [onFiles],
  )

  const open = useCallback(() => inputRef.current?.click(), [])

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) onFiles(e.target.files)
      // Reset so selecting the same file again still fires a change event.
      e.target.value = ''
    },
    [onFiles],
  )

  return {
    isDragging,
    open,
    inputProps: {
      ref: inputRef,
      type: 'file',
      multiple: true,
      accept: 'image/*',
      onChange,
      className: 'hidden',
    },
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  }
}
