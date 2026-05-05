import { ipcMain, shell, dialog } from 'electron'
import { copyFile, rename } from 'fs/promises'
import { join, basename } from 'path'
import { readdir } from 'fs/promises'

export function registerFileOpsIPC(): void {
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
