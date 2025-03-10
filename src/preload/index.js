import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ipcRenderer: {
    invoke: (channel, data) => {
      const validChannels = [
        'auth:login',
        'auth:register',
        'get:dbPath',
        'students:get',
        'students:add',
        'students:update',
        'students:delete',
        'sections:get',
        'sections:add',
        'sections:update',
        'sections:delete',
        'students:reset-db'
      ]
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data)
      }
      return Promise.reject(new Error('Invalid channel'))
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = api
  window.electronAPI = electronAPI
}
