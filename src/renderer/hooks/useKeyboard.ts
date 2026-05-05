import { useEffect } from 'react'
import { useTagStore } from '../store/tagStore'
import { useImageStore } from '../store/imageStore'
import { useFolderStore } from '../store/folderStore'

const TAG_MAP: Record<string, string> = {
  '1': 'red',
  '2': 'yellow',
  '3': 'blue',
  '4': 'green',
}

export function useKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const { focusedPath, selectPath, deselectAll, setGridColumns, gridColumns, setViewMode, viewMode } =
        useImageStore.getState()
      const { setTag, undoLastTag } = useTagStore.getState()
      const { folders, imagesByFolder } = useFolderStore.getState()

      // Tagging: 1-4 to tag, 0 to clear
      if (TAG_MAP[e.key]) {
        e.preventDefault()
        if (focusedPath) {
          const currentTag = useTagStore.getState().tagsByPath[focusedPath]
          setTag(focusedPath, currentTag === TAG_MAP[e.key] ? null : TAG_MAP[e.key])
          // Also persist to main process
          window.api.tagsSet(
            focusedPath,
            currentTag === TAG_MAP[e.key] ? null : TAG_MAP[e.key],
          )
        }
        return
      }

      if (e.key === '0') {
        e.preventDefault()
        if (focusedPath) {
          setTag(focusedPath, null)
          window.api.tagsSet(focusedPath, null)
        }
        return
      }

      // Space: toggle selection
      if (e.key === ' ') {
        e.preventDefault()
        if (focusedPath) {
          selectPath(focusedPath)
        }
        return
      }

      // Arrow keys: move focus
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const allImages = folders.flatMap((f) =>
          (imagesByFolder[f.id] || []).map((img) => img.path),
        )
        if (allImages.length === 0) return
        const idx = focusedPath ? allImages.indexOf(focusedPath) : -1
        const next = e.key === 'ArrowRight'
          ? allImages[(idx + 1) % allImages.length]
          : allImages[(idx - 1 + allImages.length) % allImages.length]
        useImageStore.getState().setFocusedPath(next)
        return
      }

      // Enter: fullscreen preview
      if (e.key === 'Enter') {
        e.preventDefault()
        if (focusedPath) {
          // Will be handled when we implement fullscreen viewer
        }
        return
      }

      // Tab: jump to next untagged
      if (e.key === 'Tab') {
        e.preventDefault()
        const allImages = folders.flatMap((f) =>
          (imagesByFolder[f.id] || []).map((img) => img.path),
        )
        const tags = useTagStore.getState().tagsByPath
        const startIdx = focusedPath ? allImages.indexOf(focusedPath) : -1
        for (let i = 1; i <= allImages.length; i++) {
          const idx = (startIdx + i) % allImages.length
          if (!tags[allImages[idx]]) {
            useImageStore.getState().setFocusedPath(allImages[idx])
            break
          }
        }
        return
      }

      // Cmd+Z: undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        const history = useTagStore.getState().tagHistory
        if (history.length > 0) {
          const last = history[history.length - 1]
          undoLastTag()
          window.api.tagsSet(last.path, last.previousTag)
        }
        return
      }

      // [ ] zoom
      if (e.key === '[') {
        useImageStore.getState().setZoomLevel(useImageStore.getState().zoomLevel - 0.1)
        return
      }
      if (e.key === ']') {
        useImageStore.getState().setZoomLevel(useImageStore.getState().zoomLevel + 0.1)
        return
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        deselectAll()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
