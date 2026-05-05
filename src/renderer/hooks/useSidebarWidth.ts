import { useState, useCallback, useRef, useEffect } from 'react'

const MIN_WIDTH = 48
const MAX_WIDTH = 320
const DEFAULT_WIDTH = 220
const STORAGE_KEY = 'imagepro:sidebar-width'

export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const n = parseInt(saved, 10)
        if (n === 0 || (n >= MIN_WIDTH && n <= MAX_WIDTH)) return n
      }
      return DEFAULT_WIDTH
    } catch {
      return DEFAULT_WIDTH
    }
  })
  const [collapsed, setCollapsed] = useState(width === 0)
  const prevWidth = useRef(DEFAULT_WIDTH)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  const toggle = useCallback(() => {
    if (collapsed) {
      setWidth(prevWidth.current)
      setCollapsed(false)
    } else {
      prevWidth.current = width || DEFAULT_WIDTH
      setWidth(0)
      setCollapsed(true)
    }
  }, [collapsed, width])

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width || prevWidth.current

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta))
        setWidth(next)
        setCollapsed(false)
        prevWidth.current = next
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [width],
  )

  return { width, collapsed, toggle, startResize }
}
