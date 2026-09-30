const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform:   () => process.platform,
  getVersion: () => ipcRenderer.invoke('get-version'),
  openFile:   (opts) => ipcRenderer.invoke('open-file', opts),
  saveFile:   (opts) => ipcRenderer.invoke('save-file', opts),
})
