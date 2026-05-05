import { useState, useEffect, useCallback } from 'react'
import { useFavoriteStore } from '../../store/favoriteStore'
import { basename } from '../../utils/path'

const HOME_DIR = '/Users/sunshuo'

interface FolderPickerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (path: string, alias: string) => void
  currentCount: number
}

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
  expanded?: boolean
  loaded?: boolean
}

const placeholderImages = Array.from({ length: 8 }, (_, i) => i)

export function FolderPicker({ isOpen, onClose, onConfirm, currentCount }: FolderPickerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [alias, setAlias] = useState('')
  const [tree, setTree] = useState<TreeNode[]>([])
  const { addFavorite } = useFavoriteStore()

  // Load root on open
  useEffect(() => {
    if (!isOpen) return
    const loadRoot = async () => {
      try {
        const entries = await window.api.fileListDir(HOME_DIR)
        setTree(entries.map((e) => ({ name: e.name, path: e.path })))
      } catch {
        setTree([])
      }
    }
    loadRoot()
  }, [isOpen])

  const toggleExpand = useCallback(async (node: TreeNode) => {
    if (node.children) {
      // Collapse
      setTree((prev) =>
        prev.map((n) => (n.path === node.path ? { ...n, expanded: false } : n)),
      )
      return
    }
    // Expand and load children
    try {
      const entries = await window.api.fileListDir(node.path)
      setTree((prev) =>
        prev.map((n) =>
          n.path === node.path
            ? { ...n, expanded: true, children: entries.map((e) => ({ name: e.name, path: e.path })) }
            : n,
        ),
      )
    } catch {
      // ignore
    }
  }, [])

  const handleSelect = (node: TreeNode) => {
    setSelectedPath(node.path)
    setAlias(basename(node.path))
  }

  const handleConfirm = () => {
    if (selectedPath) {
      onConfirm(selectedPath, alias.trim() || basename(selectedPath))
      onClose()
    }
  }

  const handleContextMenu = (path: string) => {
    addFavorite(path)
  }

  if (!isOpen) return null

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = node.path === selectedPath
    const hasChildren = node.children && node.children.length > 0
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-3 py-1 cursor-pointer text-xs transition-colors ${
            isSelected ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-surface'
          }`}
          style={{ paddingLeft: 12 + depth * 16 }}
          onClick={() => {
            toggleExpand(node)
            handleSelect(node)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            handleContextMenu(node.path)
          }}
        >
          <span className="w-3 text-[10px]">
            {hasChildren ? (node.expanded ? '▼' : '▶') : ''}
          </span>
          <span>{node.name}/</span>
        </div>
        {node.expanded &&
          node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-xl overflow-hidden shadow-2xl"
        style={{ width: 820, height: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-base font-semibold">选择文件夹</h2>
              <p className="text-muted text-[11px] mt-0.5">选择最多 8 个文件夹进行对比</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted text-lg hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex" style={{ height: 420 }}>
          {/* File tree */}
          <div className="w-[300px] bg-surface overflow-y-auto border-r border-border">
            <p className="text-dim text-[9px] font-bold px-4 py-3 uppercase tracking-wider">
              Filesystem
            </p>
            {tree.map((node) => renderNode(node))}
          </div>

          {/* Preview */}
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-dim text-[9px] font-bold uppercase tracking-wider mb-3">
              Preview — {selectedPath ? basename(selectedPath) : '未选择'}
            </p>
            {selectedPath ? (
              <div className="grid grid-cols-4 gap-2">
                {placeholderImages.map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded bg-surface/50 border border-border flex items-center justify-center"
                  >
                    <span className="text-dim text-[10px]">{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dim text-xs">选择文件夹预览图片</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3">
          <span className="text-muted text-xs">别名:</span>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="bg-bg text-white text-xs border border-border-2 rounded px-2 py-1.5 w-44 outline-none focus:border-accent/50 transition-colors"
            placeholder="输入别名"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
          />

          <span className="text-dim text-[10px] ml-auto">
            已添加 {currentCount}/8 个文件夹
          </span>

          <button
            onClick={onClose}
            className="text-muted text-xs bg-surface border border-border-2 rounded px-4 py-1.5 hover:border-muted/30 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPath}
            className="text-white text-xs bg-accent rounded px-4 py-1.5 font-semibold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            添加文件夹
          </button>
        </div>
      </div>
    </div>
  )
}
