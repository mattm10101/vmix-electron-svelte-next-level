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

  // --- NEW: Functions for Menu Bar <-> UI Communication ---

  // 1. Listens for a message FROM the main process (e.g., when a menu item is clicked)
  // and executes a callback function in the Svelte app.
  onTogglePanelVisibility: (callback) => {
    ipcRenderer.on('toggle-panel-visibility', (_event, panelId) => callback(panelId))
  },

  // 2. Sends the current state of all panels FROM the Svelte app
  // TO the main process, so the menu checkboxes can be updated.
  updateMenuState: (panelStates) => {
    ipcRenderer.send('update-menu-state', panelStates)
  }
})