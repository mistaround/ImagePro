import { create } from 'zustand'

interface TagState {
  tagsByPath: Record<string, string>
  tagHistory: { path: string; previousTag: string | null }[]
  setTag: (path: string, tag: string | null) => void
  batchSetTags: (updates: { path: string; tag: string | null }[]) => void
  undoLastTag: () => void
  loadTags: (tags: Record<string, string>) => void
}

export const useTagStore = create<TagState>((set) => ({
  tagsByPath: {},
  tagHistory: [],

  setTag: (path, tag) =>
    set((state) => {
      const previousTag = state.tagsByPath[path] ?? null
      return {
        tagsByPath: { ...state.tagsByPath, [path]: tag ?? undefined },
        tagHistory: [...state.tagHistory.slice(-99), { path, previousTag }],
      }
    }),

  batchSetTags: (updates) =>
    set((state) => {
      const historyEntries = updates.map(({ path, tag }) => ({
        path,
        previousTag: state.tagsByPath[path] ?? null,
      }))
      const newTags = { ...state.tagsByPath }
      updates.forEach(({ path, tag }) => {
        if (tag) newTags[path] = tag
        else delete newTags[path]
      })
      return {
        tagsByPath: newTags,
        tagHistory: [...state.tagHistory, ...historyEntries].slice(-100),
      }
    }),

  undoLastTag: () =>
    set((state) => {
      if (state.tagHistory.length === 0) return state
      const history = [...state.tagHistory]
      const last = history.pop()!
      const newTags = { ...state.tagsByPath }
      if (last.previousTag) newTags[last.path] = last.previousTag
      else delete newTags[last.path]
      return { tagsByPath: newTags, tagHistory: history }
    }),

  loadTags: (tags) => set({ tagsByPath: tags, tagHistory: [] }),
}))
