import { useState, useRef, useEffect } from 'react'
import { FolderEntry } from '../../store/folderStore'

interface FolderItemProps {
  folder: FolderEntry
  imageCount: number
  isActive: boolean
  onSelect: () => void
  onAliasChange: (alias: string) => void
  onColorChange: (color: string) => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function FolderItem({
  folder,
  imageCount,
  isActive,
  onSelect,
  onAliasChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: FolderItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(folder.alias)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== folder.alias) {
      onAliasChange(trimmed)
    } else {
      setEditValue(folder.alias)
    }
    setEditing(false)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`group px-3 py-2 rounded cursor-pointer transition-colors ${
        isActive ? 'bg-accent/10' : 'hover:bg-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Color dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: folder.color }}
        />

        {/* Alias (editable) */}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') {
                setEditValue(folder.alias)
                setEditing(false)
              }
            }}
            className="flex-1 bg-bg text-white text-xs px-1 py-0.5 rounded border border-border outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-white text-xs font-semibold truncate"
            onDoubleClick={() => setEditing(true)}
          >
            {folder.alias}
          </span>
        )}

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          className="text-dim text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-muted"
        >
          ✎
        </button>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-dim text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
        >
          ×
        </button>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-dim text-[10px] truncate max-w-[160px]">{folder.path}</span>
        <span className="text-muted text-[10px] flex-shrink-0 ml-2">{imageCount}张</span>
      </div>
    </div>
  )
}
