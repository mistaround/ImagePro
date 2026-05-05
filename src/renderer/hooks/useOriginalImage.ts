import { useState, useEffect, useRef } from 'react'

const fullImageCache = new Map<string, string>()

export function useOriginalImage(imagePath: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!imagePath) {
      setDataUrl(null)
      return
    }

    const cached = fullImageCache.get(imagePath)
    if (cached) {
      setDataUrl(cached)
      return
    }

    setLoading(true)
    window.api.getImage(imagePath).then((url) => {
      if (!mountedRef.current) return
      if (url) {
        fullImageCache.set(imagePath, url)
        setDataUrl(url)
      }
      setLoading(false)
    })

    return () => {
      mountedRef.current = false
    }
  }, [imagePath])

  return { dataUrl, loading }
}
