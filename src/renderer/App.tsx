import { useState, useCallback, useEffect } from 'react'
import { useSidebarWidth } from './hooks/useSidebarWidth'
import { useFolderStore } from './store/folderStore'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { BottomBar } from './components/layout/BottomBar'
import { ImageGrid } from './components/grid/ImageGrid'
import { CompareLayout } from './components/compare/CompareLayout'
import { SessionMenu } from './components/modals/SessionMenu'
import { useKeyboard } from './hooks/useKeyboard'
import { useImageStore } from './store/imageStore'
import { useTagStore } from './store/tagStore'

export default function App() {
  useKeyboard()
  const { width, collapsed, toggle, startResize } = useSidebarWidth()
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const addFolder = useFolderStore((s) => s.addFolder)
  const folders = useFolderStore((s) => s.folders)
  const imagesByFolder = useFolderStore((s) => s.imagesByFolder)
  const viewMode = useImageStore((s) => s.viewMode)

  // Clean up activeFolderId when the folder is removed
  useEffect(() => {
    if (activeFolderId && !folders.some((f) => f.id === activeFolderId)) {
      setActiveFolderId(null)
    }
  }, [folders, activeFolderId])

  // Clean up selectedPaths when folders are removed
  useEffect(() => {
    const validPaths = new Set<string>()
    for (const f of folders) {
      const images = imagesByFolder[f.id] || []
      for (const img of images) validPaths.add(img.path)
    }
    const { selectedPaths, deselectPaths, focusedPath } = useImageStore.getState()
    const stale: string[] = []
    for (const p of selectedPaths) {
      if (!validPaths.has(p)) stale.push(p)
    }
    if (stale.length > 0) deselectPaths(stale)
    // Also clean up focusedPath if stale
    if (focusedPath && !validPaths.has(focusedPath)) {
      useImageStore.getState().setFocusedPath(null)
    }
  }, [folders, imagesByFolder])

  const handleAddFolder = useCallback(async () => {
    const state = useFolderStore.getState()
    if (state.folders.length >= 6) return
    const folderPath = await window.api.fileBrowse()
    if (folderPath) {
      const id = state.addFolder(folderPath)
      const images = await window.api.folderScan(folderPath)
      useFolderStore.getState().setImages(id, images)
      setActiveFolderId(id)
    }
  }, [])

  const handleFavoriteSelect = useCallback(async (path: string, alias: string) => {
    const state = useFolderStore.getState()
    if (state.folders.length >= 6) return
    const id = addFolder(path, alias)
    const images = await window.api.folderScan(path)
    useFolderStore.getState().setImages(id, images)
    setActiveFolderId(id)
  }, [addFolder])

  const handleExport = useCallback(async () => {
    const folders = useFolderStore.getState().folders
    const imagesByFolder = useFolderStore.getState().imagesByFolder
    const tagsByPath = useTagStore.getState().tagsByPath

    const rows: { file_path: string; folder: string; alias: string; tag: string; tagged_at: string }[] = []
    for (const folder of folders) {
      const images = imagesByFolder[folder.id] || []
      for (const img of images) {
        const tag = tagsByPath[img.path]
        if (tag) {
          rows.push({
            file_path: img.path,
            folder: folder.path,
            alias: folder.alias,
            tag,
            tagged_at: new Date().toISOString(),
          })
        }
      }
    }
    await window.api.exportData('csv', rows)
  }, [])

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Top bar — draggable region, padded for macOS traffic lights */}
      <div className="h-12 bg-panel flex items-center gap-3 border-b border-border flex-shrink-0 relative titlebar-drag"
        style={{ paddingLeft: '80px', paddingRight: '16px' }}
      >
        <button
          onClick={toggle}
          className="titlebar-no-drag text-muted text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface transition-colors"
        >
          ☰
        </button>
        <span className="text-white text-sm font-semibold tracking-wide">ImagePro</span>
        <div className="flex-1" />
        <button
          onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
          className="titlebar-no-drag text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors"
        >
          Session ▾
        </button>
        <SessionMenu isOpen={sessionMenuOpen} onToggle={() => setSessionMenuOpen(false)} />
        <button
          onClick={handleExport}
          className="titlebar-no-drag text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors"
        >
          导出结果
        </button>
        <button className="titlebar-no-drag text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors">
          ⚙
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          width={width}
          collapsed={collapsed}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onAddFolder={handleAddFolder}
          onFavoriteSelect={handleFavoriteSelect}
        />

        {/* Resize handle */}
        {!collapsed && (
          <div
            className="w-1 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors flex-shrink-0"
            onMouseDown={startResize}
          />
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {viewMode === 'grid' ? (
            <>
              <Toolbar />
              <ImageGrid />
              <BottomBar />
            </>
          ) : (
            <CompareLayout />
          )}
        </div>
      </div>
    </div>
  )
}
