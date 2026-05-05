import { useFavoriteStore } from '../../store/favoriteStore'
import { useFolderStore } from '../../store/folderStore'
import { basename } from '../../utils/path'

interface FavoriteListProps {
  onSelect: (path: string, alias: string) => void
}

export function FavoriteList({ onSelect }: FavoriteListProps) {
  const favorites = useFavoriteStore((s) => s.favorites)
  const removeFavorite = useFavoriteStore((s) => s.removeFavorite)
  const folders = useFolderStore((s) => s.folders)

  if (favorites.length === 0) return null

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    removeFavorite(path)
  }

  return (
    <div>
      <p className="text-dim text-[10px] font-semibold px-3 mb-1">收藏路径</p>
      {favorites.map((fav) => {
        const alreadyAdded = folders.some((f) => f.path === fav)
        return (
          <div
            key={fav}
            className="flex items-center px-3 py-1 hover:bg-surface rounded cursor-pointer group"
            onClick={() => !alreadyAdded && onSelect(fav, basename(fav))}
            onContextMenu={(e) => handleContextMenu(e, fav)}
          >
            <span className="text-[#ffd700] text-[10px] mr-2">★</span>
            <span className={`text-xs truncate flex-1 ${alreadyAdded ? 'text-dim' : 'text-muted'}`}>
              {fav}
            </span>
          </div>
        )
      })}
    </div>
  )
}
