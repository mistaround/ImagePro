import { create } from 'zustand'
import { tokens } from '../styles/tokens'
import { basename } from '../utils/path'

let idCounter = 0
function genId(): string {
  return `folder_${++idCounter}_${Date.now()}`
}

export interface FolderEntry {
  id: string
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
  imagesByFolder: Record<string, ImageFile[]>  // keyed by folder.id
  loadingFolders: Set<string>
  addFolder: (path: string, alias?: string) => string  // returns new folder id
  removeFolder: (id: string) => void
  updateAlias: (id: string, alias: string) => void
  updateColor: (id: string, color: string) => void
  reorderFolders: (fromIndex: number, toIndex: number) => void
  setImages: (folderId: string, images: ImageFile[]) => void
  setLoading: (folderId: string, loading: boolean) => void
}

const getNextColor = (usedColors: string[]): string => {
  const available = tokens.expColors.filter((c) => !usedColors.includes(c))
  return available[0] ?? tokens.expColors[usedColors.length % tokens.expColors.length]
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  imagesByFolder: {},
  loadingFolders: new Set<string>(),

  addFolder: (path, alias) => {
    const id = genId()
    set((state) => {
      if (state.folders.length >= 6) return state
      const usedColors = state.folders.map((f) => f.color)
      return {
        folders: [
          ...state.folders,
          {
            id,
            path,
            alias: alias || basename(path),
            color: getNextColor(usedColors),
          },
        ],
      }
    })
    return id
  },

  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      imagesByFolder: Object.fromEntries(
        Object.entries(state.imagesByFolder).filter(([k]) => k !== id),
      ),
    })),

  updateAlias: (id, alias) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, alias } : f)),
    })),

  updateColor: (id, color) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, color } : f)),
    })),

  reorderFolders: (fromIndex, toIndex) =>
    set((state) => {
      const newFolders = [...state.folders]
      const [moved] = newFolders.splice(fromIndex, 1)
      newFolders.splice(toIndex, 0, moved)
      return { folders: newFolders }
    }),

  setImages: (folderId, images) =>
    set((state) => ({
      imagesByFolder: { ...state.imagesByFolder, [folderId]: images },
    })),

  setLoading: (folderId, loading) =>
    set((state) => {
      const next = new Set(state.loadingFolders)
      if (loading) next.add(folderId)
      else next.delete(folderId)
      return { loadingFolders: next }
    }),
}))
