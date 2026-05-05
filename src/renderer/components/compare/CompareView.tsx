import { useMemo, useState, useCallback } from 'react'
import { useFolderStore, ImageFile, FolderEntry } from '../../store/folderStore'
import { useImageStore } from '../../store/imageStore'
import { ComparePanel } from './ComparePanel'

interface AlignedRow {
  filename: string
  images: (ImageFile | null)[]
}

function alignByName(folders: FolderEntry[], imagesByFolder: Record<string, ImageFile[]>): AlignedRow[] {
  // Collect all unique filenames across all folders (union)
  const nameMap = new Map<string, (ImageFile | null)[]>()
  for (const folder of folders) {
    const images = imagesByFolder[folder.path] || []
    for (const img of images) {
      if (!nameMap.has(img.name)) {
        nameMap.set(img.name, new Array(folders.length).fill(null))
      }
    }
  }

  // Fill in images
  for (let fi = 0; fi < folders.length; fi++) {
    const folder = folders[fi]
    const images = imagesByFolder[folder.path] || []
    const imgMap = new Map(images.map((img) => [img.name, img]))
    for (const [name, row] of nameMap) {
      row[fi] = imgMap.get(name) ?? null
    }
  }

  return Array.from(nameMap.entries()).map(([filename, images]) => ({
    filename,
    images,
  }))
}

export function CompareView() {
  const folders = useFolderStore((s) => s.folders)
  const imagesByFolder = useFolderStore((s) => s.imagesByFolder)
  const setViewMode = useImageStore((s) => s.setViewMode)

  const [syncZoom, setSyncZoom] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)
  const [rowIndex, setRowIndex] = useState(0)

  const rows = useMemo(() => alignByName(folders, imagesByFolder), [folders, imagesByFolder])

  const currentRow = rows[rowIndex] || null

  const goToPrev = useCallback(() => {
    setRowIndex((i) => Math.max(0, i - 1))
  }, [])

  const goToNext = useCallback(() => {
    setRowIndex((i) => Math.min(rows.length - 1, i + 1))
  }, [rows.length])

  const handleZoomChange = useCallback((delta: number) => {
    if (syncZoom) {
      setZoom((z) => Math.max(0.25, Math.min(3, z + delta)))
    }
  }, [syncZoom])

  if (folders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">添加文件夹开始对比</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">所选文件夹中没有同名图片可供对比</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Compare toolbar */}
      <div className="h-10 bg-panel flex items-center px-4 gap-3 border-b border-border flex-shrink-0">
        <span className="text-muted text-xs">
          {currentRow?.filename || '—'}
        </span>
        <span className="text-dim text-xs">对比视图</span>

        <div className="flex-1" />

        <button
          onClick={goToPrev}
          disabled={rowIndex === 0}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-2 py-0.5 hover:border-muted/30 disabled:opacity-30 transition-colors"
        >
          ← 上一组
        </button>
        <span className="text-muted text-xs">{rowIndex + 1} / {rows.length}</span>
        <button
          onClick={goToNext}
          disabled={rowIndex >= rows.length - 1}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-2 py-0.5 hover:border-muted/30 disabled:opacity-30 transition-colors"
        >
          下一组 →
        </button>

        <button
          onClick={() => setViewMode('grid')}
          className="text-accent text-xs border border-accent/40 rounded px-2 py-0.5"
        >
          ⊞ 网格模式
        </button>
      </div>

      {/* Panels + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panels */}
        <div className="flex-1 flex gap-1.5 p-2 overflow-hidden">
          {folders.map((folder, fi) => (
            <div key={folder.path} className="flex-1 min-w-0">
              <ComparePanel
                image={currentRow?.images[fi] ?? null}
                alias={folder.alias}
                color={folder.color}
                zoom={zoom}
                syncScroll={syncScroll}
                scrollTop={scrollTop}
                onScroll={setScrollTop}
                onZoomChange={handleZoomChange}
              />
            </div>
          ))}
        </div>

        {/* Sync sidebar */}
        <div className="w-44 bg-surface border-l border-border flex-shrink-0 p-3 flex flex-col gap-3">
          <p className="text-dim text-[10px] font-semibold">同步控制</p>

          <label className="flex items-center gap-2 text-muted text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={syncZoom}
              onChange={() => setSyncZoom(!syncZoom)}
              className="accent-accent"
            />
            同步缩放
          </label>

          <label className="flex items-center gap-2 text-muted text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={() => setSyncScroll(!syncScroll)}
              className="accent-accent"
            />
            同步滚动
          </label>

          <div className="border-t border-border" />

          <div className="text-dim text-[10px]">
            <p>第 {rowIndex + 1} 组</p>
            <p>共 {rows.length} 组</p>
          </div>
        </div>
      </div>
    </div>
  )
}
