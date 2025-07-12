const { contextBridge, ipcRenderer } = require('electron')

console.log('✅ Preload script has been loaded!')

contextBridge.exposeInMainWorld('electronAPI', {
  sendCommand: (command) => ipcRenderer.send('to-vmix', command),
  receive: (callback) => {
    ipcRenderer.on('from-vmix', (_ev, data) => callback(data))
  },
  getAllInputs: () => ipcRenderer.invoke('get-all-inputs'),
  // NEW: Exposing the XPath query function
  queryXpath: (xpath) => ipcRenderer.invoke('query-xpath', xpath),
})
