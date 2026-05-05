import { useMemo, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFolderStore, ImageFile } from '../../store/folderStore'
import { useImageStore } from '../../store/imageStore'
import { ImageCard } from './ImageCard'

interface ImageGridProps {
  activeFolderPath: string | null
}

export function ImageGrid({ activeFolderPath }: ImageGridProps) {
  const folders = useFolderStore((s) => s.folders)
  const imagesByFolder = useFolderStore((s) => s.imagesByFolder)
  const gridColumns = useImageStore((s) => s.gridColumns)
  const zoomLevel = useImageStore((s) => s.zoomLevel)
  const sortKey = useImageStore((s) => s.sortKey)
  const sortOrder = useImageStore((s) => s.sortOrder)

  const containerRef = useRef<HTMLDivElement>(null)

  // Collect all images from all folders with their folder metadata
  const allImages = useMemo(() => {
    const result: { image: ImageFile; folderAlias: string; folderColor: string }[] = []
    for (const folder of folders) {
      const images = imagesByFolder[folder.path] || []
      for (const img of images) {
        result.push({
          image: img,
          folderAlias: folder.alias,
          folderColor: folder.color,
        })
      }
    }
    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.image.name.localeCompare(b.image.name)
      else if (sortKey === 'time') cmp = a.image.mtime - b.image.mtime
      else if (sortKey === 'size') cmp = a.image.size - b.image.size
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return result
  }, [folders, imagesByFolder, sortKey, sortOrder])

  // Calculate card dimensions based on zoom
  const cardBaseWidth = useMemo(() => {
    if (!containerRef.current) return 200
    const containerWidth = containerRef.current.clientWidth - 16
    return (containerWidth / gridColumns) - 8
  }, [gridColumns, zoomLevel])

  const cardWidth = cardBaseWidth * zoomLevel
  const cardHeight = cardWidth * 1.1 + 32
  const rowCount = Math.ceil(allImages.length / gridColumns)

  const getRowItems = useCallback(
    (rowIndex: number) => {
      const start = rowIndex * gridColumns
      return allImages.slice(start, start + gridColumns)
    },
    [allImages, gridColumns],
  )

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => cardHeight,
    overscan: 3,
  })

  if (folders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">添加文件夹开始浏览图片</p>
      </div>
    )
  }

  if (allImages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">所选文件夹中没有图片</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-auto p-2">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const items = getRowItems(virtualRow.index)
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex gap-2 px-2"
            >
              {items.map(({ image, folderAlias, folderColor }) => (
                <div key={image.path} style={{ width: cardWidth, flexShrink: 0 }}>
                  <ImageCard
                    image={image}
                    folderAlias={folderAlias}
                    folderColor={folderColor}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
