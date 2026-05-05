import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useImageStore } from '../../store/imageStore'
import { useFolderStore, ImageFile } from '../../store/folderStore'
import { ComparePanel, PANEL_LABELS } from './ComparePanel'
import { CompareSidebar } from './CompareSidebar'

const MIN_RIGHT_WIDTH = 48
const MAX_RIGHT_WIDTH = 300
const DEFAULT_RIGHT_WIDTH = 220

export function CompareLayout() {
  const folders = useFolderStore((s) => s.folders)
  const setViewMode = useImageStore((s) => s.setViewMode)
  const viewMode = useImageStore((s) => s.viewMode)

  const [syncZoom, setSyncZoom] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<(ImageFile | null)[] | null>(null)

  // peek: Map<panelIndex, fromPanelIndex> — shows which panel index each panel is peeking from (long-press)
  const [peekMap, setPeekMap] = useState<Record<number, number>>({})

  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const prevRightWidth = useRef(DEFAULT_RIGHT_WIDTH)

  const displayFolders = useMemo(() => folders.slice(0, 6), [folders])

  const toggleRight = useCallback(() => {
    if (rightCollapsed) {
      setRightWidth(prevRightWidth.current)
      setRightCollapsed(false)
    } else {
      prevRightWidth.current = rightWidth || DEFAULT_RIGHT_WIDTH
      setRightWidth(0)
      setRightCollapsed(true)
    }
  }, [rightCollapsed, rightWidth])

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = rightWidth || prevRightWidth.current
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      const next = Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, startWidth + delta))
      setRightWidth(next)
      setRightCollapsed(false)
      prevRightWidth.current = next
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth])

  useEffect(() => {
    if (viewMode === 'compare' && rightCollapsed) {
      setRightWidth(prevRightWidth.current || DEFAULT_RIGHT_WIDTH)
      setRightCollapsed(false)
    }
  }, [viewMode])

  const handleZoomChange = useCallback((delta: number) => {
    if (syncZoom) {
      setZoom((z) => Math.max(0.25, Math.min(3, z + delta)))
    }
  }, [syncZoom])

  const handleSelectGroup = useCallback((group: (ImageFile | null)[]) => {
    setSelectedGroup(group)
    setPeekMap({})
  }, [])

  const handlePeekStart = useCallback((targetIdx: number, fromIdx: number) => {
    setPeekMap((prev) => ({ ...prev, [targetIdx]: fromIdx }))
  }, [])

  const handlePeekEnd = useCallback((targetIdx: number) => {
    setPeekMap((prev) => {
      const next = { ...prev }
      delete next[targetIdx]
      return next
    })
  }, [])

  // Compute display images for each panel (original or peeked)
  const displayGroup = useMemo(() => {
    if (!selectedGroup) return null
    return selectedGroup.map((img, i) => {
      const fromIdx = peekMap[i]
      if (fromIdx !== undefined) {
        return selectedGroup?.[fromIdx] ?? null
      }
      return img
    })
  }, [selectedGroup, peekMap])

  // Grid layout: n=1→1col, n=2→2col, n=3→3col, n=4→2x2, n=5→2x3, n=6→2x3
  const gridCols = displayFolders.length <= 3 ? displayFolders.length : displayFolders.length <= 4 ? 2 : 3
  const gridRows = displayFolders.length <= 3 ? 1 : 2

  return (
    <div className="flex-1 flex overflow-hidden min-w-0">
      {/* Center area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="h-8 bg-panel flex items-center px-3 gap-3 border-b border-border flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className="text-muted text-[10px] bg-surface border border-border-2 rounded px-2 py-0.5 hover:border-muted/30 transition-colors"
          >
            ⊞ 预览模式
          </button>

          <span className="text-dim text-[10px]">|</span>

          <button
            onClick={toggleRight}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              rightCollapsed
                ? 'text-dim border-border-2'
                : 'text-accent border-accent/40 bg-accent/10'
            }`}
          >
            ☷ 图片列表
          </button>

          <span className="text-dim text-[10px]">|</span>

          <label className="flex items-center gap-1 text-dim text-[9px] cursor-pointer">
            <input type="checkbox" checked={syncZoom} onChange={() => setSyncZoom(!syncZoom)} className="accent-accent w-2.5 h-2.5" />
            同步缩放
          </label>

          <label className="flex items-center gap-1 text-dim text-[9px] cursor-pointer">
            <input type="checkbox" checked={syncScroll} onChange={() => setSyncScroll(!syncScroll)} className="accent-accent w-2.5 h-2.5" />
            同步滚动
          </label>

          <span className="text-dim text-[9px] ml-auto">{Math.round(zoom * 100)}%</span>

          {selectedGroup && (
            <span className="text-dim text-[10px]">
              {selectedGroup.filter(Boolean).length}/{displayFolders.length}
            </span>
          )}
        </div>

        {/* Panels in adaptive grid */}
        {folders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-dim text-sm">请先添加文件夹</p>
              <p className="text-dim text-xs mt-2">在右侧选择图片进行对比</p>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 grid gap-1 p-1.5 overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            }}
          >
            {displayFolders.map((folder, i) => {
              const originalImg = selectedGroup?.[i] ?? null
              const displayImg = displayGroup?.[i]
              const peekingFrom = peekMap[i] ?? null

              // Other images (for peek buttons): all other panels' original images
              const otherImages = displayFolders
                .map((_, j) => (j === i ? null : selectedGroup?.[j] ?? null))
                .filter((_, j) => j !== i)

              return (
                <div key={folder.id} className="min-w-0 min-h-0">
                  <ComparePanel
                    image={originalImg}
                    displayImage={displayImg !== originalImg ? displayImg : undefined}
                    alias={folder.alias}
                    color={folder.color}
                    zoom={zoom}
                    syncScroll={syncScroll}
                    scrollTop={scrollTop}
                    panelIndex={i}
                    totalPanels={displayFolders.length}
                    otherImages={otherImages}
                    peekingFrom={peekingFrom}
                    onScroll={setScrollTop}
                    onZoomChange={handleZoomChange}
                    onPeekStart={(fromIdx) => handlePeekStart(i, fromIdx)}
                    onPeekEnd={() => handlePeekEnd(i)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right resize handle */}
      {!rightCollapsed && (
        <div
          className="w-1 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors flex-shrink-0"
          onMouseDown={startResizeRight}
        />
      )}

      {/* Right sidebar */}
      <CompareSidebar
        width={rightWidth}
        collapsed={rightCollapsed}
        onToggle={toggleRight}
        onSelectGroup={handleSelectGroup}
        selectedGroup={selectedGroup}
      />
    </div>
  )
}
