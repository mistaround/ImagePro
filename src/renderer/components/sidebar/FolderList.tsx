import { useFolderStore } from '../../store/folderStore'
import { FolderItem } from './FolderItem'

interface FolderListProps {
  activeFolderId: string | null
  onSelectFolder: (id: string) => void
}

export function FolderList({ activeFolderId, onSelectFolder }: FolderListProps) {
  const folders = useFolderStore((s) => s.folders)
  const imagesByFolder = useFolderStore((s) => s.imagesByFolder)
  const removeFolder = useFolderStore((s) => s.removeFolder)
  const updateAlias = useFolderStore((s) => s.updateAlias)
  const reorderFolders = useFolderStore((s) => s.reorderFolders)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIdx !== toIdx && !isNaN(fromIdx)) {
      reorderFolders(fromIdx, toIdx)
    }
  }

  if (folders.length === 0) {
    return (
      <div className="px-3 py-4 text-dim text-[10px] text-center">
        暂无文件夹，点击上方按钮添加
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {folders.map((folder, idx) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          imageCount={(imagesByFolder[folder.id] || []).length}
          isActive={folder.id === activeFolderId}
          onSelect={() => onSelectFolder(folder.id)}
          onAliasChange={(alias) => updateAlias(folder.id, alias)}
          onColorChange={(color) => updateAlias(folder.id, color)}
          onRemove={() => removeFolder(folder.id)}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, idx)}
        />
      ))}
    </div>
  )
}
