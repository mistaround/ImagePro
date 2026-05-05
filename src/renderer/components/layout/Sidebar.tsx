import { tokens } from '../../styles/tokens'
import { useFolderStore } from '../../store/folderStore'
import { FolderList } from '../sidebar/FolderList'
import { FavoriteList } from '../sidebar/FavoriteList'
import { TagStats } from '../sidebar/TagStats'

interface SidebarProps {
  width: number
  collapsed: boolean
  activeFolderId: string | null
  onSelectFolder: (id: string) => void
  onAddFolder: () => void
  onFavoriteSelect: (path: string, alias: string) => void
}

export function Sidebar({
  width,
  collapsed,
  activeFolderId,
  onSelectFolder,
  onAddFolder,
  onFavoriteSelect,
}: SidebarProps) {
  const folders = useFolderStore((s) => s.folders)

  return (
    <div
      className="h-full flex flex-col bg-surface flex-shrink-0 overflow-hidden transition-[width] duration-200"
      style={{
        width: collapsed ? 0 : width,
        borderRight: collapsed ? 'none' : `1px solid ${tokens.colors.border}`,
      }}
    >
      {!collapsed && (
        <div className="flex flex-col h-full overflow-y-auto py-4 gap-4">
          <div className="px-3">
            <button
              onClick={onAddFolder}
              disabled={folders.length >= 8}
              className={`w-full py-2 rounded text-xs font-semibold border transition-colors ${
                folders.length >= 8
                  ? 'text-dim border-border bg-surface/50 cursor-not-allowed'
                  : 'text-accent border-accent/40 bg-accent/10 hover:bg-accent/20'
              }`}
            >
              {folders.length >= 8 ? '已达上限 6/6' : '+ 添加文件夹'}
            </button>
          </div>

          <div>
            <p className="text-dim text-[10px] font-semibold px-3 mb-1">当前实验组</p>
            <FolderList
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
            />
          </div>

          <div className="border-t border-border mx-3" />

          <FavoriteList onSelect={onFavoriteSelect} />

          <div className="border-t border-border mx-3" />

          <TagStats />
        </div>
      )}
    </div>
  )
}
