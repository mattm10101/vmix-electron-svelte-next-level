// electron/preload.cjs

const { contextBridge, ipcRenderer } = require('electron')

console.log('✅ Preload script has been loaded!')

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Existing Functions ---
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

  // --- NEW: Function for the Preferences Modal ---
  // Listens for the 'open-options-modal' message from the main process
  onOpenOptionsModal: (callback) => {
    ipcRenderer.on('open-options-modal', () => callback())
  }
})