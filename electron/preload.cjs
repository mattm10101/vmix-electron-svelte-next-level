const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // This is the critical change. It sends all commands over the TCP connection.
  sendCommand: (command) => ipcRenderer.send('to-vmix', command),

  // For receiving real-time TCP events
  receive: (callback) => {
    ipcRenderer.on('from-vmix', (_ev, data) => callback(data))
  },

  // For getting the full list of inputs
  getAllInputs: () => ipcRenderer.invoke('get-all-inputs'),
})
