import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ipcRenderer: {
    invoke: (channel, data) => {
      console.log('Attempting to invoke channel:', channel, 'with data:', data)
      
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
        'students:reset-db',
        'dashboard:getData',
        'attendance:get',
        'attendance:mark',
        'attendance:getByDateRange'
      ]
      
      console.log('Valid channels:', validChannels)
      console.log('Is channel valid?', validChannels.includes(channel))
      
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
    console.log('Setting up context bridge...')
    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
    console.log('Context bridge setup complete')
  } catch (error) {
    console.error('Context bridge setup error:', error)
  }
} else {
  console.log('Context isolation disabled, setting up window globals...')
  window.electron = api
  window.electronAPI = electronAPI
  console.log('Window globals setup complete')
}
