import { useState, useCallback } from 'react'

interface SyncState {
  syncZoom: boolean
  syncScroll: boolean
}

export function useSync() {
  const [sync, setSync] = useState<SyncState>({
    syncZoom: true,
    syncScroll: true,
  })

  const toggleSyncZoom = useCallback(() => {
    setSync((s) => ({ ...s, syncZoom: !s.syncZoom }))
  }, [])

  const toggleSyncScroll = useCallback(() => {
    setSync((s) => ({ ...s, syncScroll: !s.syncScroll }))
  }, [])

  return { ...sync, toggleSyncZoom, toggleSyncScroll }
}
