import { ipcMain } from 'electron'
import sharp from 'sharp'
import { stat } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { homedir } from 'os'

const CACHE_DIR = join(homedir(), '.imagepro', 'thumbs')
const MAX_SIZE = 300

function cacheKey(filePath: string, mtime: number): string {
  return createHash('md5').update(`${filePath}::${mtime}`).digest('hex')
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

export function registerThumbnailIPC(): void {
  ipcMain.handle('thumbnail:get', async (_, imagePath: string) => {
    try {
      ensureCacheDir()

      let mtime: number
      try {
        const s = await stat(imagePath)
        mtime = s.mtimeMs
      } catch {
        return null
      }

      const key = cacheKey(imagePath, mtime)
      const cachePath = join(CACHE_DIR, key)

      // Return cached thumbnail if exists
      if (existsSync(cachePath)) {
        const cached = readFileSync(cachePath)
        return `data:image/webp;base64,${cached.toString('base64')}`
      }

      // Generate thumbnail
      const thumbnail = await sharp(imagePath)
        .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      writeFileSync(cachePath, thumbnail)
      return `data:image/webp;base64,${thumbnail.toString('base64')}`
    } catch {
      return null
    }
  })
}
