import { useRef, useEffect, memo } from 'react'
import { useThumbnail } from '../../hooks/useThumbnail'
import { useTagStore } from '../../store/tagStore'
import { tokens } from '../../styles/tokens'
import type { ImageFile } from '../../store/folderStore'

interface ComparePanelProps {
  image: ImageFile | null
  alias: string
  color: string
  zoom: number
  syncScroll: boolean
  scrollTop: number
  onScroll: (scrollTop: number) => void
  onZoomChange: (delta: number) => void
}

export const ComparePanel = memo(function ComparePanel({
  image,
  alias,
  color,
  zoom,
  syncScroll,
  scrollTop,
  onScroll,
  onZoomChange,
}: ComparePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const { thumbnail } = useThumbnail(image?.path ?? null)
  const tag = useTagStore((s) => (image ? s.tagsByPath[image.path] : undefined))
  const setTag = useTagStore((s) => s.setTag)

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
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ backgroundColor: color + '15' }}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-white text-xs font-semibold">{alias}</span>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-b-lg border border-border bg-surface"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {image && thumbnail ? (
          <div ref={imgRef} className="relative flex items-center justify-center min-h-full p-2">
            <img
              src={thumbnail}
              alt={image.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full object-contain transition-transform"
            />
            {/* Overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white/80 text-[10px] font-semibold">{alias}</span>
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
        ) : (
          <div className="flex items-center justify-center h-full text-dim text-xs">
            {image ? '加载中...' : '无图片'}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      {image && (
        <div className="flex justify-between px-2 py-1.5">
          <span className="text-muted text-[10px]">
            {image.width && image.height
              ? `${image.width} × ${image.height}`
              : image.name}
          </span>
          <span className="text-muted text-[10px]">
            {image.size > 1024 * 1024
              ? `${(image.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(image.size / 1024)} KB`}
          </span>
        </div>
      )}

      {/* Quick tag row */}
      {image && (
        <div className="flex items-center gap-2 px-2 pb-2">
          <span className="text-dim text-[10px]">快速打标:</span>
          {Object.entries(tokens.tagColors).map(([key, color]) => (
            <button
              key={key}
              onClick={() => handleTag(key)}
              className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors ${
                tag === key ? 'border-white/60' : 'border-transparent'
              }`}
              style={{ backgroundColor: color + '33', color, borderColor: tag === key ? color : undefined }}
            >
              {['red', 'yellow', 'blue', 'green'].indexOf(key) + 1}
            </button>
          ))}
          <span className="text-dim text-[10px] ml-auto">{Math.round(zoom * 100)}%</span>
        </div>
      )}
    </div>
  )
})
