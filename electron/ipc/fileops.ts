import { ipcMain, shell, dialog, app } from 'electron'
import { copyFile, rename, readFile } from 'fs/promises'
import { join, basename, extname } from 'path'
import { readdir } from 'fs/promises'
import { homedir } from 'os'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.tiff': 'image/tiff',
}

export function registerFileOpsIPC(): void {
  ipcMain.handle('file:getImage', async (_, filePath: string) => {
    try {
      const buf = await readFile(filePath)
      const ext = extname(filePath).toLowerCase()
      const mime = MIME_TYPES[ext] || 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  })

  ipcMain.handle('file:copy', async (_, src: string, destDir: string) => {
    const name = basename(src)
    const dest = join(destDir, name)
    await copyFile(src, dest)
  })

  ipcMain.handle('file:move', async (_, src: string, destDir: string) => {
    const name = basename(src)
    const dest = join(destDir, name)
    await rename(src, dest)
  })

  ipcMain.handle('file:delete', async (_, filePath: string) => {
    await shell.trashItem(filePath)
  })

  ipcMain.handle('file:browse', async (_, dirPath?: string) => {
    const result = await dialog.showOpenDialog({
      defaultPath: dirPath || undefined,
      properties: ['openDirectory'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('file:getHomeDir', () => {
    return homedir()
  })

  ipcMain.handle('file:listDir', async (_, dirPath: string) => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => ({
          name: e.name,
          path: join(dirPath, e.name),
        }))
    } catch {
      return []
    }
  })
}
