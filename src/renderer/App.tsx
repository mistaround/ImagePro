import { useState, useCallback } from 'react'
import { useSidebarWidth } from './hooks/useSidebarWidth'
import { useFolderStore } from './store/folderStore'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { BottomBar } from './components/layout/BottomBar'
import { ImageGrid } from './components/grid/ImageGrid'
import { CompareView } from './components/compare/CompareView'
import { SessionMenu } from './components/modals/SessionMenu'
import { useKeyboard } from './hooks/useKeyboard'
import { useImageStore } from './store/imageStore'
import { useTagStore } from './store/tagStore'

export default function App() {
  useKeyboard()
  const { width, collapsed, toggle, startResize } = useSidebarWidth()
  const [activeFolderPath, setActiveFolderPath] = useState<string | null>(null)
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const addFolder = useFolderStore((s) => s.addFolder)
  const viewMode = useImageStore((s) => s.viewMode)

  const handleAddFolder = useCallback(async () => {
    const folders = useFolderStore.getState().folders
    if (folders.length >= 8) return
    const folderPath = await window.api.fileBrowse()
    if (folderPath) {
      addFolder(folderPath)
      const images = await window.api.folderScan(folderPath)
      useFolderStore.getState().setImages(folderPath, images)
      setActiveFolderPath(folderPath)
    }
  }, [addFolder])

  const handleFavoriteSelect = useCallback(async (path: string, alias: string) => {
    const folders = useFolderStore.getState().folders
    if (folders.length >= 8) return
    addFolder(path, alias)
    const images = await window.api.folderScan(path)
    useFolderStore.getState().setImages(path, images)
    setActiveFolderPath(path)
  }, [addFolder])

  const handleExport = useCallback(async () => {
    const folders = useFolderStore.getState().folders
    const imagesByFolder = useFolderStore.getState().imagesByFolder
    const tagsByPath = useTagStore.getState().tagsByPath

    const rows: { file_path: string; folder: string; alias: string; tag: string; tagged_at: string }[] = []
    for (const folder of folders) {
      const images = imagesByFolder[folder.path] || []
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
      {/* Top bar */}
      <div className="h-12 bg-panel flex items-center px-4 gap-3 border-b border-border flex-shrink-0 relative">
        <button
          onClick={toggle}
          className="text-muted text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-surface transition-colors"
        >
          ☰
        </button>
        <span className="text-white text-sm font-semibold tracking-wide">ImagePro</span>
        <div className="flex-1" />
        <button
          onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors"
        >
          Session ▾
        </button>
        <SessionMenu isOpen={sessionMenuOpen} onToggle={() => setSessionMenuOpen(false)} />
        <button
          onClick={handleExport}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors"
        >
          导出结果
        </button>
        <button className="text-muted text-xs bg-surface border border-border-2 rounded px-3 py-1 hover:border-muted/30 transition-colors">
          ⚙
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          width={width}
          collapsed={collapsed}
          activeFolderPath={activeFolderPath}
          onSelectFolder={setActiveFolderPath}
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
              <ImageGrid activeFolderPath={activeFolderPath} />
              <BottomBar />
            </>
          ) : (
            <CompareView />
          )}
        </div>
      </div>
    </div>
  )
}
