// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (our UI)
contextBridge.exposeInMainWorld('electronAPI', {
  // For sending one-way commands to the main process
  send: (command) => ipcRenderer.send('to-vmix', command),

  // For receiving real-time events from the main process
  receive: (callback) => ipcRenderer.on('from-vmix', (_event, value) => callback(value)),

  // For fetching a single input's name and getting a response
  getInputName: (inputNumber) => ipcRenderer.invoke('get-input-name', inputNumber),
});
