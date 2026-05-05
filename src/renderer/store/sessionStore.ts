import { create } from 'zustand'

export interface Session {
  id: string
  name: string
  folders: {
    path: string
    alias: string
    color: string
  }[]
  viewMode: 'grid' | 'compare'
  gridColumns: number
  createdAt: number
}

interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  setSessions: (sessions: Session[]) => void
  setCurrentSessionId: (id: string | null) => void
  addSession: (session: Session) => void
  removeSession: (id: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSessionId: null,

  setSessions: (sessions) => set({ sessions }),

  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
    })),
}))
