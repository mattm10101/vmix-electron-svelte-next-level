// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (our Angular app)
contextBridge.exposeInMainWorld('electronAPI', {
  // Function to send data from Renderer to Main (e.g., a vMix command)
  send: (command) => ipcRenderer.send('to-vmix', command),

  // Function to receive data from Main to Renderer (e.g., a vMix response)
  // The callback function (e.g., (data) => { ... }) will be executed in the renderer
  receive: (callback) => ipcRenderer.on('from-vmix', (_event, value) => callback(value)),
});
