import { useState, useCallback } from 'react'
import { useImageStore } from '../../store/imageStore'
import { useFolderStore, ImageFile } from '../../store/folderStore'
import { ComparePanel } from './ComparePanel'

export function CompareView() {
  const folders = useFolderStore((s) => s.folders)
  const setViewMode = useImageStore((s) => s.setViewMode)

  const [syncZoom, setSyncZoom] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<(ImageFile | null)[] | null>(null)

  const handleZoomChange = useCallback((delta: number) => {
    if (syncZoom) {
      setZoom((z) => Math.max(0.25, Math.min(3, z + delta)))
    }
  }, [syncZoom])

  if (folders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-dim text-sm">请先添加文件夹</p>
          <p className="text-dim text-xs mt-2">在右侧选择图片进行对比</p>
        </div>
      </div>
    )
  }

  const displayFolders = folders.slice(0, 6)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Compact toolbar */}
      <div className="h-8 bg-panel flex items-center px-3 gap-3 border-b border-border flex-shrink-0">
        <button
          onClick={() => setViewMode('grid')}
          className="text-muted text-[10px] bg-surface border border-border-2 rounded px-2 py-0.5 hover:border-muted/30 transition-colors"
        >
          ⊞ 预览模式
        </button>

        <span className="text-dim text-[10px]">|</span>

        <label className="flex items-center gap-1 text-muted text-[10px] cursor-pointer">
          <input type="checkbox" checked={syncZoom} onChange={() => setSyncZoom(!syncZoom)} className="accent-accent w-3 h-3" />
          同步缩放
        </label>

        <label className="flex items-center gap-1 text-muted text-[10px] cursor-pointer">
          <input type="checkbox" checked={syncScroll} onChange={() => setSyncScroll(!syncScroll)} className="accent-accent w-3 h-3" />
          同步滚动
        </label>

        <div className="flex-1" />

        {selectedGroup && (
          <span className="text-dim text-[10px]">
            {selectedGroup.filter(Boolean).length} / {displayFolders.length} 张
          </span>
        )}
      </div>

      {/* Panels */}
      <div className="flex-1 flex gap-1 p-1.5 overflow-hidden">
        {displayFolders.map((folder, i) => {
          const img = selectedGroup?.[i] ?? null
          return (
            <div key={folder.id} className="flex-1 min-w-0">
              <ComparePanel
                image={img}
                alias={folder.alias}
                color={folder.color}
                zoom={i === 0 ? zoom : syncZoom ? zoom : zoom}
                syncScroll={syncScroll}
                scrollTop={scrollTop}
                onScroll={setScrollTop}
                onZoomChange={handleZoomChange}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type { ImageFile }
