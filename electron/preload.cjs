// electron/preload.cjs

const { contextBridge, ipcRenderer } = require('electron')

console.log('✅ Preload script has been loaded!')

contextBridge.exposeInMainWorld('electronAPI', {
  sendCommand: (command) => ipcRenderer.send('to-vmix', command),
  receive: (callback) => {
    ipcRenderer.on('from-vmix', (_ev, data) => callback(data))
  },
  getAllInputs: () => ipcRenderer.invoke('get-all-inputs'),
  queryXpath: (xpath) => ipcRenderer.invoke('query-xpath', xpath),
  onTogglePanelVisibility: (callback) => {
    ipcRenderer.on('toggle-panel-visibility', (_event, panelId) => callback(panelId))
  },
  updateMenuState: (panelStates) => {
    ipcRenderer.send('update-menu-state', panelStates)
  },
  onOpenOptionsModal: (callback) => {
    ipcRenderer.on('open-options-modal', () => callback())
  },
  onVuData: (callback) => {
    ipcRenderer.on('vmix-vu-data', (_event, data) => callback(data));
  }
})