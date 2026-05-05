import { create } from 'zustand'
import { tokens } from '../styles/tokens'

export interface FolderEntry {
  path: string
  alias: string
  color: string
}

export interface ImageFile {
  path: string
  name: string
  size: number
  mtime: number
  width?: number
  height?: number
}

interface FolderState {
  folders: FolderEntry[]
  imagesByFolder: Record<string, ImageFile[]>
  loadingFolders: Set<string>
  addFolder: (path: string, alias?: string) => void
  removeFolder: (path: string) => void
  updateAlias: (path: string, alias: string) => void
  updateColor: (path: string, color: string) => void
  reorderFolders: (fromIndex: number, toIndex: number) => void
  setImages: (folderPath: string, images: ImageFile[]) => void
  setLoading: (folderPath: string, loading: boolean) => void
}

const getNextColor = (usedColors: string[]): string => {
  const available = tokens.expColors.filter((c) => !usedColors.includes(c))
  return available[0] ?? tokens.expColors[usedColors.length % tokens.expColors.length]
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  imagesByFolder: {},
  loadingFolders: new Set<string>(),

  addFolder: (path, alias) =>
    set((state) => {
      if (state.folders.length >= 8) return state
      if (state.folders.some((f) => f.path === path)) return state
      const usedColors = state.folders.map((f) => f.color)
      return {
        folders: [
          ...state.folders,
          {
            path,
            alias: alias || path.split('/').pop() || path,
            color: getNextColor(usedColors),
          },
        ],
      }
    }),

  removeFolder: (path) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.path !== path),
      imagesByFolder: Object.fromEntries(
        Object.entries(state.imagesByFolder).filter(([k]) => k !== path),
      ),
    })),

  updateAlias: (path, alias) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.path === path ? { ...f, alias } : f)),
    })),

  updateColor: (path, color) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.path === path ? { ...f, color } : f)),
    })),

  reorderFolders: (fromIndex, toIndex) =>
    set((state) => {
      const newFolders = [...state.folders]
      const [moved] = newFolders.splice(fromIndex, 1)
      newFolders.splice(toIndex, 0, moved)
      return { folders: newFolders }
    }),

  setImages: (folderPath, images) =>
    set((state) => ({
      imagesByFolder: { ...state.imagesByFolder, [folderPath]: images },
    })),

  setLoading: (folderPath, loading) =>
    set((state) => {
      const next = new Set(state.loadingFolders)
      if (loading) next.add(folderPath)
      else next.delete(folderPath)
      return { loadingFolders: next }
    }),
}))
