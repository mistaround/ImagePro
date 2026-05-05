import { useState, useMemo } from 'react'
import { useFolderStore, ImageFile } from '../../store/folderStore'
import { useThumbnail } from '../../hooks/useThumbnail'

interface CompareSidebarProps {
  width: number
  collapsed: boolean
  onToggle: () => void
  onSelectGroup: (images: (ImageFile | null)[]) => void
  selectedGroup: (ImageFile | null)[] | null
}

function MiniThumb({ filePath }: { filePath: string | null }) {
  const { thumbnail, loading } = useThumbnail(filePath)
  if (!filePath) return <div className="w-10 h-10 rounded bg-surface/50" />
  if (loading) return <div className="w-10 h-10 rounded bg-surface animate-pulse" />
  return (
    <img src={thumbnail ?? undefined} className="w-10 h-10 rounded object-cover" />
  )
}

export function CompareSidebar({
  width,
  collapsed,
  onToggle,
  onSelectGroup,
  selectedGroup,
}: CompareSidebarProps) {
  const folders = useFolderStore((s) => s.folders)
  const imagesByFolder = useFolderStore((s) => s.imagesByFolder)
  const [matchByName, setMatchByName] = useState(true)
  const [perFolderIndexes, setPerFolderIndexes] = useState<Record<string, number>>({})

  // Mode A: match by name — find filenames present in ALL folders (intersection)
  const matchedNames = useMemo(() => {
    if (!matchByName) return []
    const nameSets = folders.map((f) => {
      const images = imagesByFolder[f.id] || []
      return new Set(images.map((img) => img.name))
    })
    if (nameSets.length === 0) return []
    const first = nameSets[0]
    const intersection = new Set([...first].filter((name) =>
      nameSets.every((s) => s.has(name)),
    ))
    return [...intersection].sort()
  }, [folders, imagesByFolder, matchByName])

  // Map matched name → images array (one per folder)
  const matchedGroups = useMemo(() => {
    const groups: Map<string, (ImageFile | null)[]> = new Map()
    for (const name of matchedNames) {
      const group: (ImageFile | null)[] = folders.map((f) => {
        const images = imagesByFolder[f.id] || []
        return images.find((img) => img.name === name) ?? null
      })
      groups.set(name, group)
    }
    return groups
  }, [matchedNames, folders, imagesByFolder])

  // Mode B: per-folder images (for independent selection)
  const perFolderImages = useMemo(() => {
    return folders.map((f) => ({
      folder: f,
      images: imagesByFolder[f.id] || [],
    }))
  }, [folders, imagesByFolder])

  const handleNameClick = (name: string) => {
    const group = matchedGroups.get(name)
    if (group) onSelectGroup(group)
  }

  const handlePerFolderSelect = (folderIdx: number, imageIdx: number) => {
    const newIdx = { ...perFolderIndexes, [String(folderIdx)]: imageIdx }
    setPerFolderIndexes(newIdx)

    // Build group from current selections
    const group: (ImageFile | null)[] = folders.map((f, fi) => {
      const images = imagesByFolder[f.id] || []
      const idx = newIdx[String(fi)] ?? 0
      return images[idx] ?? null
    })
    onSelectGroup(group)
  }

  return (
    <div
      className="h-full flex flex-col bg-surface border-l border-border flex-shrink-0 overflow-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 0 : width }}
    >
      {!collapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-border">
            <span className="text-muted text-[10px] font-semibold">图片选择</span>
            <button
              onClick={onToggle}
              className="text-dim hover:text-muted transition-colors text-xs"
            >
              ×
            </button>
          </div>

          {/* Match by name toggle */}
          <div className="px-3 py-2 border-b border-border">
            <label className="flex items-center gap-2 text-muted text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={matchByName}
                onChange={(e) => setMatchByName(e.target.checked)}
                className="accent-accent"
              />
              同名匹配
            </label>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {matchByName ? (
              /* Mode A: unified matched-name list with thumbnails */
              <div className="flex flex-col">
                {matchedNames.length === 0 ? (
                  <p className="text-dim text-[10px] text-center py-8 px-3">
                    没有在所有文件夹中都存在的同名文件
                  </p>
                ) : (
                  matchedNames.map((name) => {
                    const group = matchedGroups.get(name)
                    const firstImg = group?.[0]
                    const isActive =
                      selectedGroup?.some((img, i) => img?.name === name && group?.[i]?.path === img?.path)
                    return (
                      <button
                        key={name}
                        onClick={() => handleNameClick(name)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent/5 transition-colors ${
                          isActive ? 'bg-accent/10 border-l-2 border-accent' : 'border-l-2 border-transparent'
                        }`}
                      >
                        <MiniThumb filePath={firstImg?.path ?? null} />
                        <span className="text-muted text-[10px] truncate">{name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : (
              /* Mode B: per-folder independent lists */
              <div className="flex flex-col">
                {perFolderImages.map(({ folder, images }, fi) => (
                  <div key={folder.id} className="border-b border-border last:border-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 sticky top-0 bg-surface">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                      <span className="text-muted text-[10px] font-semibold truncate">
                        {folder.alias}
                      </span>
                      <span className="text-dim text-[9px] ml-auto">{images.length}张</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {images.map((img, imgIdx) => {
                        const isSelected = perFolderIndexes[String(fi)] === imgIdx
                        return (
                          <button
                            key={img.path}
                            onClick={() => handlePerFolderSelect(fi, imgIdx)}
                            className={`flex items-center gap-2 px-3 py-1 w-full text-left hover:bg-accent/5 transition-colors ${
                              isSelected ? 'bg-accent/10 border-l-2 border-accent' : 'border-l-2 border-transparent'
                            }`}
                            style={{ paddingLeft: isSelected ? 11 : 12 }}
                          >
                            <MiniThumb filePath={img.path} />
                            <span className="text-muted text-[10px] truncate">{img.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
