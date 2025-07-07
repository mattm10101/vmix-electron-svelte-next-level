// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

// --- vMix TCP Connection Settings ---
const VMIX_HOST = '127.0.0.1'; // Change this if vMix is on another computer
const VMIX_PORT = 8099;

let mainWindow;
const client = new net.Socket();
let isVmixConnected = false;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
}

// --- TCP Client Logic ---

function connectToVmix() {
    console.log(`Attempting to connect to vMix at ${VMIX_HOST}:${VMIX_PORT}`);
    client.connect(VMIX_PORT, VMIX_HOST, () => {
        console.log('Successfully connected to vMix TCP API.');
        isVmixConnected = true;
        // Automatically subscribe to TALLY events on connection
        // This will cause vMix to send us TALLY updates whenever they change.
        console.log('Auto-subscribing to TALLY events.');
        client.write('SUBSCRIBE TALLY\r\n');
    });
}

// Listen for data from the vMix server
client.on('data', (data) => {
  console.log(`Received from vMix: ${data.toString().trim()}`);
  if (mainWindow) {
    // Forward the raw data to the renderer process
    mainWindow.webContents.send('from-vmix', data.toString());
  }
});

// Handle connection closing
client.on('close', () => {
  console.log('Connection to vMix closed. Reconnecting in 5 seconds...');
  isVmixConnected = false;
  setTimeout(connectToVmix, 5000); // Attempt to reconnect after 5s
});

// Handle TCP errors
client.on('error', (err) => {
  console.error('vMix TCP Connection Error:', err.message);
});


// --- Electron App Lifecycle ---

app.whenReady().then(() => {
  createWindow();
  connectToVmix();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC (Inter-Process Communication) ---

// Listen for commands from the renderer process
ipcMain.on('to-vmix', (event, command) => {
  if (isVmixConnected && command) {
    console.log(`Sending to vMix: ${command}`);
    // vMix commands need to be terminated with a carriage return and newline
    client.write(command + '\r\n');
  } else if (!isVmixConnected) {
    console.warn('Cannot send command. vMix is not connected.');
    if (mainWindow) {
        mainWindow.webContents.send('from-vmix', 'ERROR: vMix not connected.\r\n');
    }
  }
});
