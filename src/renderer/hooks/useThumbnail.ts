import { useState, useEffect, useRef } from 'react'

const loadedUrls = new Map<string, string>()

export function useThumbnail(imagePath: string | null) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!imagePath) return

    // Check cache first
    const cached = loadedUrls.get(imagePath)
    if (cached) {
      setThumbnail(cached)
      return
    }

    setLoading(true)
    let revoked = false

    window.api.thumbnailGet(imagePath).then((dataUrl) => {
      if (!mountedRef.current) return
      if (dataUrl) {
        loadedUrls.set(imagePath, dataUrl)
        setThumbnail(dataUrl)
      }
      setLoading(false)
    })

    return () => {
      mountedRef.current = false
      if (revoked && thumbnail) {
        // Revoke is handled when card goes off-screen via ImageGrid
      }
    }
  }, [imagePath])

  return { thumbnail, loading }
}

// Call when images are scrolled far off-screen to free memory
export function revokeThumbnail(imagePath: string) {
  const url = loadedUrls.get(imagePath)
  if (url) {
    // Don't actually revoke data URLs (they're not blob URLs)
    // Just remove from cache if needed
    loadedUrls.delete(imagePath)
  }
}
