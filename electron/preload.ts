import { contextBridge, ipcRenderer } from 'electron'

const api = {
  folderScan: (folderPath: string) => ipcRenderer.invoke('folder:scan', folderPath),
  folderWatch: (folderPath: string) => ipcRenderer.invoke('folder:watch', folderPath),
  thumbnailGet: (imagePath: string) => ipcRenderer.invoke('thumbnail:get', imagePath),
  fileCopy: (src: string, dest: string) => ipcRenderer.invoke('file:copy', src, dest),
  fileMove: (src: string, dest: string) => ipcRenderer.invoke('file:move', src, dest),
  fileDelete: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
  fileBrowse: (dirPath?: string) => ipcRenderer.invoke('file:browse', dirPath),
  fileListDir: (dirPath: string) => ipcRenderer.invoke('file:listDir', dirPath),
  getHomeDir: () => ipcRenderer.invoke('file:getHomeDir'),
  getImage: (filePath: string) => ipcRenderer.invoke('file:getImage', filePath),
  tagsGet: (filePath: string) => ipcRenderer.invoke('tags:get', filePath),
  tagsSet: (filePath: string, tag: string | null) => ipcRenderer.invoke('tags:set', filePath, tag),
  tagsBatchGet: (filePaths: string[]) => ipcRenderer.invoke('tags:batchGet', filePaths),
  tagsGetAll: () => ipcRenderer.invoke('tags:getAll'),
  tagsUndo: () => ipcRenderer.invoke('tags:undo'),
  sessionSave: (session: unknown) => ipcRenderer.invoke('session:save', session),
  sessionLoad: (id: string) => ipcRenderer.invoke('session:load', id),
  sessionList: () => ipcRenderer.invoke('session:list'),
  sessionDelete: (id: string) => ipcRenderer.invoke('session:delete', id),
  exportData: (format: string, data: unknown) => ipcRenderer.invoke('export:data', format, data),
  onFolderChanged: (callback: (event: unknown) => void) => {
    ipcRenderer.on('folder:changed', (_event, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
