import { useState, useEffect, useRef } from 'react'
import { useSessionStore, Session } from '../../store/sessionStore'
import { useFolderStore } from '../../store/folderStore'
import { useImageStore } from '../../store/imageStore'

interface SessionMenuProps {
  isOpen: boolean
  onToggle: () => void
}

export function SessionMenu({ isOpen, onToggle }: SessionMenuProps) {
  const [sessionName, setSessionName] = useState('')
  const { sessions, setSessions, addSession } = useSessionStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      window.api.sessionList().then((list) => {
        setSessions(list as Session[])
      })
    }
  }, [isOpen, setSessions])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onToggle])

  const handleSave = async () => {
    const name = sessionName.trim() || `Session ${new Date().toLocaleDateString()}`
    const folders = useFolderStore.getState().folders
    const viewMode = useImageStore.getState().viewMode
    const gridColumns = useImageStore.getState().gridColumns

    const session = {
      id: Date.now().toString(),
      name,
      folders: folders.map((f) => ({ path: f.path, alias: f.alias, color: f.color })),
      viewMode,
      gridColumns,
      createdAt: Date.now(),
    }

    await window.api.sessionSave({
      id: session.id,
      name: session.name,
      data: JSON.stringify(session),
    })

    addSession(session)
    setSessionName('')
  }

  const handleLoad = async (id: string) => {
    const row = await window.api.sessionLoad(id)
    if (row && row.data) {
      const session = JSON.parse(row.data)
      const folders = useFolderStore.getState()
      session.folders.forEach((f: { path: string; alias: string; color: string }) => {
        folders.addFolder(f.path, f.alias)
        // Scan folder
        window.api.folderScan(f.path).then((images) => {
          useFolderStore.getState().setImages(f.path, images)
        })
      })
      useImageStore.getState().setViewMode(session.viewMode)
      useImageStore.getState().setGridColumns(session.gridColumns)
      useSessionStore.getState().setCurrentSessionId(id)
    }
    onToggle()
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute top-12 right-4 w-64 bg-panel border border-border rounded-lg shadow-xl z-50 overflow-hidden"
    >
      <div className="p-3 border-b border-border">
        <input
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session 名称..."
          className="w-full bg-surface text-white text-xs border border-border-2 rounded px-2 py-1.5 outline-none focus:border-accent/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
        />
        <button
          onClick={handleSave}
          className="w-full mt-2 py-1.5 bg-accent text-white text-xs font-semibold rounded hover:opacity-90 transition-colors"
        >
          保存当前 Session
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-dim text-xs text-center py-8">暂无保存的 Session</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => handleLoad(s.id)}
              className="px-3 py-2 hover:bg-surface cursor-pointer transition-colors"
            >
              <p className="text-white text-xs">{s.name}</p>
              <p className="text-dim text-[10px] mt-0.5">
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
