import { useRef, useEffect, memo } from 'react'
import { useOriginalImage } from '../../hooks/useOriginalImage'
import { useTagStore } from '../../store/tagStore'
import { tokens } from '../../styles/tokens'
import type { ImageFile } from '../../store/folderStore'

export const PANEL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

interface ComparePanelProps {
  image: ImageFile | null
  alias: string
  color: string
  zoom: number
  syncScroll: boolean
  scrollTop: number
  panelIndex: number
  totalPanels: number
  otherImages: (ImageFile | null)[]
  peekingFrom: number | null
  onScroll: (scrollTop: number) => void
  onZoomChange: (delta: number) => void
  onPeekStart: (fromPanelIdx: number) => void
  onPeekEnd: () => void
  displayImage?: ImageFile | null  // The image actually being displayed (may be peek image)
}

export const ComparePanel = memo(function ComparePanel({
  image,
  alias,
  color,
  zoom,
  syncScroll,
  scrollTop,
  panelIndex,
  totalPanels,
  otherImages,
  peekingFrom,
  onScroll,
  onZoomChange,
  onPeekStart,
  onPeekEnd,
  displayImage,
}: ComparePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const displayPath = displayImage?.path ?? image?.path ?? null
  const { dataUrl, loading } = useOriginalImage(displayPath)
  const tag = useTagStore((s) => (image ? s.tagsByPath[image.path] : undefined))
  const setTag = useTagStore((s) => s.setTag)
  const label = PANEL_LABELS[panelIndex] || String(panelIndex)

  useEffect(() => {
    if (containerRef.current && syncScroll) {
      containerRef.current.scrollTop = scrollTop
    }
  }, [scrollTop, syncScroll])

  const handleScroll = () => {
    if (!syncScroll && containerRef.current) {
      onScroll(containerRef.current.scrollTop)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      onZoomChange(e.deltaY > 0 ? -0.1 : 0.1)
    }
  }

  const handleTag = (tagColor: string) => {
    if (!image) return
    setTag(image.path, tag === tagColor ? null : tagColor)
    window.api.tagsSet(image.path, tag === tagColor ? null : tagColor)
  }

  return (
    <div className="flex flex-col h-full" style={{ minWidth: 0 }}>
      {/* Header with peek buttons */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-t-lg"
        style={{ backgroundColor: color + '15' }}
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-white text-[10px] font-semibold truncate">{alias}</span>
        <span className="text-dim text-[9px] font-bold ml-auto mr-1">{label}</span>

        {/* Peek buttons - long press */}
        {totalPanels > 1 && (
          <div className="flex gap-0.5">
            {otherImages.map((_, otherIdx) => {
              const actualIdx = otherIdx >= panelIndex ? otherIdx + 1 : otherIdx
              const otherLabel = PANEL_LABELS[actualIdx] || String(actualIdx)
              const isActive = peekingFrom === actualIdx
              return (
                <button
                  key={otherLabel}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onPeekStart(actualIdx)
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onPeekEnd()
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation()
                    if (isActive) onPeekEnd()
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onPeekStart(actualIdx)
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onPeekEnd()
                  }}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors select-none ${
                    isActive
                      ? 'bg-accent/30 border-accent text-accent'
                      : 'bg-surface/50 border-border-2 text-dim hover:border-muted/50 hover:text-muted'
                  }`}
                  title={`长按对比 ${otherLabel}`}
                >
                  {otherLabel}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Image area - full original image */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto border border-border bg-surface rounded-b-lg"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {image && dataUrl ? (
          <div className="relative flex items-center justify-center min-h-full p-2">
            <img
              src={dataUrl}
              alt={image.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full object-contain transition-transform"
              draggable={false}
            />
            {/* Overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white/80 text-[10px] font-semibold">{alias}</span>
              {peekingFrom !== null && (
                <span className="text-accent text-[9px]">
                  (peek {PANEL_LABELS[peekingFrom]})
                </span>
              )}
            </div>
            {/* Tag indicator */}
            {tag && (
              <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: tokens.tagColors[tag as keyof typeof tokens.tagColors],
                  }}
                />
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-dim text-xs">
            <div className="w-6 h-6 border-2 border-border border-t-muted rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-dim text-xs">
            {image ? '加载中...' : '无图片'}
          </div>
        )}
      </div>

      {/* Footer */}
      {image && (
        <div className="flex justify-between px-2 py-1">
          <span className="text-muted text-[10px] truncate max-w-[60%]">{image.name}</span>
          <span className="text-muted text-[9px]">
            {image.size > 1024 * 1024
              ? `${(image.size / (1024 * 1024)).toFixed(1)}M`
              : `${Math.round(image.size / 1024)}K`}
          </span>
        </div>
      )}

      {/* Quick tag row */}
      {image && (
        <div className="flex items-center gap-1 px-2 pb-1">
          {Object.entries(tokens.tagColors).map(([key, tagColor]) => (
            <button
              key={key}
              onClick={() => handleTag(key)}
              className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold border ${
                tag === key ? 'border-white/60' : 'border-transparent'
              }`}
              style={{ backgroundColor: tagColor + '22', color: tagColor, borderColor: tag === key ? tagColor : undefined }}
            >
              {['red', 'yellow', 'blue', 'green'].indexOf(key) + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
