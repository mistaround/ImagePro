import { memo, useCallback } from 'react'
import { useThumbnail } from '../../hooks/useThumbnail'
import { useTagStore } from '../../store/tagStore'
import { useImageStore } from '../../store/imageStore'
import { tokens } from '../../styles/tokens'
import { SourceOverlay } from './SourceOverlay'
import type { ImageFile } from '../../store/folderStore'

interface ImageCardProps {
  image: ImageFile
  folderAlias: string
  folderColor: string
}

export const ImageCard = memo(function ImageCard({
  image,
  folderAlias,
  folderColor,
}: ImageCardProps) {
  const { thumbnail, loading } = useThumbnail(image.path)
  const tag = useTagStore((s) => s.tagsByPath[image.path])
  const setTag = useTagStore((s) => s.setTag)
  const selectedPaths = useImageStore((s) => s.selectedPaths)
  const selectPath = useImageStore((s) => s.selectPath)
  const focusedPath = useImageStore((s) => s.focusedPath)
  const tagFilter = useImageStore((s) => s.tagFilter)

  const isSelected = selectedPaths.has(image.path)
  const isFocused = focusedPath === image.path

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      selectPath(image.path, e.metaKey || e.ctrlKey)
    },
    [image.path, selectPath],
  )

  const handleTag = useCallback(
    (e: React.MouseEvent, tagColor: string) => {
      e.stopPropagation()
      setTag(image.path, tag === tagColor ? null : tagColor)
    },
    [image.path, tag, setTag],
  )

  // Filter by tag
  if (tagFilter && tag !== tagFilter) return null

  const sizeLabel =
    image.size > 1024 * 1024
      ? `${(image.size / (1024 * 1024)).toFixed(1)}M`
      : `${Math.round(image.size / 1024)}K`

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-lg overflow-hidden bg-surface border cursor-pointer transition-all group ${
        isFocused ? 'ring-1 ring-accent' : ''
      } ${
        isSelected ? 'border-accent' : 'border-border hover:border-border-2'
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-square">
        {loading && !thumbnail ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-border border-t-muted rounded-full animate-spin" />
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={image.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-dim text-xs">无预览</span>
          </div>
        )}

        {/* Source overlay */}
        <SourceOverlay alias={folderAlias} color={folderColor} />

        {/* Tag indicator */}
        {tag && (
          <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: tokens.tagColors[tag as keyof typeof tokens.tagColors] }}
            />
          </div>
        )}

        {/* Hover quick tag buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {Object.entries(tokens.tagColors).map(([key, color]) => (
            <button
              key={key}
              onClick={(e) => handleTag(e, key)}
              className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${
                tag === key
                  ? 'border-white/60'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color + '33', color }}
            >
              {['red', 'yellow', 'blue', 'green'].indexOf(key) + 1}
            </button>
          ))}
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 flex justify-between items-center">
        <span className="text-muted text-[10px] truncate max-w-[70%]">{image.name}</span>
        <span className="text-dim text-[10px] flex-shrink-0">{sizeLabel}</span>
      </div>
    </div>
  )
})
