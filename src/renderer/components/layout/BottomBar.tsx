import { useImageStore } from '../../store/imageStore'
import { useTagStore } from '../../store/tagStore'

export function BottomBar() {
  const selectedPaths = useImageStore((s) => s.selectedPaths)
  const deselectAll = useImageStore((s) => s.deselectAll)
  const batchSetTags = useTagStore((s) => s.batchSetTags)

  const count = selectedPaths.size

  const handleBatchTag = (tag: string) => {
    const paths = Array.from(selectedPaths)
    const updates = paths.map((path) => {
      const currentTag = useTagStore.getState().tagsByPath[path]
      return { path, tag: currentTag === tag ? null : tag }
    })
    batchSetTags(updates)
    updates.forEach(({ path, tag }) => {
      window.api.tagsSet(path, tag)
    })
    deselectAll()
  }

  const handleCopy = async () => {
    const dest = await window.api.fileBrowse()
    if (!dest) return
    for (const path of selectedPaths) {
      await window.api.fileCopy(path, dest)
    }
    deselectAll()
  }

  const handleMove = async () => {
    const dest = await window.api.fileBrowse()
    if (!dest) return
    for (const path of selectedPaths) {
      await window.api.fileMove(path, dest)
    }
    deselectAll()
  }

  const handleDelete = async () => {
    for (const path of selectedPaths) {
      await window.api.fileDelete(path)
    }
    deselectAll()
  }

  return (
    <div className="h-11 bg-panel flex items-center px-4 gap-2 border-t border-border flex-shrink-0">
      <span className="text-muted text-xs">
        已选 {count} 张
      </span>

      <div className="flex gap-2 ml-2">
        <button
          disabled={count === 0}
          onClick={handleCopy}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-2 py-1 hover:border-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          复制到…
        </button>
        <button
          disabled={count === 0}
          onClick={handleMove}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-2 py-1 hover:border-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          移动到…
        </button>
        <button
          disabled={count === 0}
          onClick={handleDelete}
          className="text-[#ff4757] text-xs bg-[#ff4757]/10 border border-[#ff4757]/40 rounded px-2 py-1 hover:border-[#ff4757]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          删除
        </button>
        <button
          disabled={count === 0}
          onClick={deselectAll}
          className="text-muted text-xs bg-surface border border-border-2 rounded px-2 py-1 hover:border-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          清除选择
        </button>
      </div>

      <div className="flex-1" />

      <span className="text-dim text-[10px]">
        1-4: 打标 Space: 选中 Enter: 全屏 ←→: 切换 Tab: 下一未标记 Cmd+Z: 撤销
      </span>
    </div>
  )
}
