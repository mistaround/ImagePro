import { ipcMain, BrowserWindow } from 'electron'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import chokidar from 'chokidar'

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.gif',
])

export interface ImageFileInfo {
  path: string
  name: string
  size: number
  mtime: number
  width?: number
  height?: number
}

const watchers = new Map<string, chokidar.FSWatcher>()

async function scanFolder(folderPath: string): Promise<ImageFileInfo[]> {
  const results: ImageFileInfo[] = []

  async function walk(dir: string) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        try {
          const s = await stat(fullPath)
          results.push({
            path: fullPath,
            name: entry.name,
            size: s.size,
            mtime: s.mtimeMs,
          })
        } catch {
          // skip inaccessible files
        }
      }
    }
  }

  await walk(folderPath)
  return results
}

export function registerFolderIPC(): void {
  ipcMain.handle('folder:scan', async (_, folderPath: string) => {
    return scanFolder(folderPath)
  })

  ipcMain.handle('folder:watch', async (_, folderPath: string) => {
    // Close existing watcher for this path
    const existing = watchers.get(folderPath)
    if (existing) {
      await existing.close()
    }

    const watcher = chokidar.watch(folderPath, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })

    const onChange = () => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('folder:changed', folderPath)
      }
    }

    watcher.on('add', onChange)
    watcher.on('unlink', onChange)
    watcher.on('addDir', onChange)
    watcher.on('unlinkDir', onChange)

    watchers.set(folderPath, watcher)
  })
}
