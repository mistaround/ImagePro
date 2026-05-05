import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerFolderIPC } from './ipc/folder'
import { registerThumbnailIPC } from './ipc/thumbnail'
import { registerTagsIPC } from './ipc/tags'
import { registerFileOpsIPC } from './ipc/fileops'
import { registerExportIPC } from './ipc/export'

let mainWindow: BrowserWindow | null = null

function registerIpc(): void {
  registerFolderIPC()
  registerThumbnailIPC()
  registerTagsIPC()
  registerFileOpsIPC()
  registerExportIPC()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0e0e16',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' || process.env['ELECTRON_RENDERER_URL']) {
    const url = process.env['ELECTRON_RENDERER_URL']!
    mainWindow.loadURL(url)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
