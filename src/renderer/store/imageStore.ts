import { create } from 'zustand'

type ViewMode = 'grid' | 'compare'
type SortKey = 'name' | 'time' | 'size'
type SortOrder = 'asc' | 'desc'

interface ImageState {
  viewMode: ViewMode
  gridColumns: number
  zoomLevel: number
  sortKey: SortKey
  sortOrder: SortOrder
  selectedPaths: Set<string>
  focusedPath: string | null
  tagFilter: string | null
  setViewMode: (mode: ViewMode) => void
  setGridColumns: (cols: number) => void
  setZoomLevel: (zoom: number) => void
  setSortKey: (key: SortKey) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  selectPath: (path: string, multi?: boolean) => void
  deselectAll: () => void
  setFocusedPath: (path: string | null) => void
  setTagFilter: (tag: string | null) => void
}

export const useImageStore = create<ImageState>((set) => ({
  viewMode: 'grid',
  gridColumns: 4,
  zoomLevel: 1,
  sortKey: 'name',
  sortOrder: 'asc',
  selectedPaths: new Set<string>(),
  focusedPath: null,
  tagFilter: null,

  setViewMode: (mode) => set({ viewMode: mode }),

  setGridColumns: (cols) => set({ gridColumns: cols }),

  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.25, Math.min(3, zoom)) }),

  setSortKey: (key) => set({ sortKey: key }),

  setSortOrder: (order) => set({ sortOrder: order }),

  toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),

  selectPath: (path, multi = false) =>
    set((state) => {
      const next = new Set(multi ? state.selectedPaths : [])
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return { selectedPaths: next, focusedPath: path }
    }),

  deselectAll: () => set({ selectedPaths: new Set() }),

  setFocusedPath: (path) => set({ focusedPath: path }),

  setTagFilter: (tag) => set({ tagFilter: tag }),
}))
