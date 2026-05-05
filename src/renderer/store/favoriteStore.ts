import { create } from 'zustand'

const STORAGE_KEY = 'imagepro:favorites'

function loadFavorites(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

interface FavoriteState {
  favorites: string[]
  addFavorite: (path: string) => void
  removeFavorite: (path: string) => void
}

export const useFavoriteStore = create<FavoriteState>((set) => ({
  favorites: loadFavorites(),

  addFavorite: (path) =>
    set((state) => {
      const next = state.favorites.includes(path)
        ? state.favorites
        : [path, ...state.favorites].slice(0, 50)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { favorites: next }
    }),

  removeFavorite: (path) =>
    set((state) => {
      const next = state.favorites.filter((f) => f !== path)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { favorites: next }
    }),
}))
