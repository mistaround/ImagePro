import { ipcMain, dialog } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'

export function registerExportIPC(): void {
  ipcMain.handle('export:data', async (_, format: string, data: unknown) => {
    const result = await dialog.showSaveDialog({
      defaultPath: join(homedir(), 'Desktop', `imagepro-export.${format}`),
      filters: format === 'csv'
        ? [{ name: 'CSV', extensions: ['csv'] }]
        : [{ name: 'JSON', extensions: ['json'] }],
    })

    if (result.canceled || !result.filePath) return false

    let content: string
    if (format === 'csv') {
      const rows = data as { file_path: string; folder: string; alias: string; tag: string; tagged_at: string }[]
      const header = 'file_path,folder,alias,tag,tagged_at'
      const lines = rows.map((r) =>
        [r.file_path, r.folder, r.alias, r.tag, r.tagged_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      content = [header, ...lines].join('\n')
    } else {
      content = JSON.stringify(data, null, 2)
    }

    await writeFile(result.filePath, content, 'utf-8')
    return true
  })
}
