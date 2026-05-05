import { useImageStore } from '../../store/imageStore'

const COLUMN_OPTIONS = [2, 4, 6, 8]
const SORT_OPTIONS: { key: 'name' | 'time' | 'size'; label: string }[] = [
  { key: 'name', label: '文件名' },
  { key: 'time', label: '修改时间' },
  { key: 'size', label: '文件大小' },
]

export function Toolbar() {
  const gridColumns = useImageStore((s) => s.gridColumns)
  const setGridColumns = useImageStore((s) => s.setGridColumns)
  const sortKey = useImageStore((s) => s.sortKey)
  const setSortKey = useImageStore((s) => s.setSortKey)
  const sortOrder = useImageStore((s) => s.sortOrder)
  const toggleSortOrder = useImageStore((s) => s.toggleSortOrder)
  const viewMode = useImageStore((s) => s.viewMode)
  const setViewMode = useImageStore((s) => s.setViewMode)
  const zoomLevel = useImageStore((s) => s.zoomLevel)
  const setZoomLevel = useImageStore((s) => s.setZoomLevel)

  return (
    <div className="h-10 bg-panel flex items-center px-4 gap-2 border-b border-border flex-shrink-0">
      {/* Column selector */}
      <div className="flex items-center gap-1 text-muted text-xs">
        <span>网格</span>
        <select
          value={gridColumns}
          onChange={(e) => setGridColumns(Number(e.target.value))}
          className="bg-panel text-muted text-xs border border-border-2 rounded px-1 py-0.5 outline-none cursor-pointer"
        >
          {COLUMN_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}列
            </option>
          ))}
        </select>
      </div>

      <span className="text-dim text-xs">|</span>

      {/* Sort selector */}
      <div className="flex items-center gap-1 text-muted text-xs">
        <span>排序:</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as 'name' | 'time' | 'size')}
          className="bg-panel text-muted text-xs border border-border-2 rounded px-1 py-0.5 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={toggleSortOrder}
          className="text-muted hover:text-white transition-colors"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <span className="text-dim text-xs">|</span>

      {/* tag filter */}
      <div className="flex items-center gap-1 text-muted text-xs">
        <span>筛选标记 ▾</span>
      </div>

      <div className="flex-1" />

      {/* View mode toggle */}
      <button
        onClick={() => setViewMode(viewMode === 'grid' ? 'compare' : 'grid')}
        className={`text-xs border rounded px-2 py-0.5 transition-colors ${
          viewMode === 'compare'
            ? 'text-accent border-accent/40 bg-accent/10'
            : 'text-muted border-border-2 hover:border-muted/30'
        }`}
      >
        {viewMode === 'grid' ? '对比模式' : '网格模式'}
      </button>

      {/* Zoom controls */}
      <button
        onClick={() => setZoomLevel(zoomLevel - 0.1)}
        className="text-muted text-xs hover:text-white transition-colors"
      >
        －
      </button>
      <span className="text-dim text-[10px]">{Math.round(zoomLevel * 100)}%</span>
      <button
        onClick={() => setZoomLevel(zoomLevel + 0.1)}
        className="text-muted text-xs hover:text-white transition-colors"
      >
        ＋
      </button>
    </div>
  )
}
