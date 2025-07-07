// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

// --- vMix Connection Settings ---
const VMIX_HOST = '127.0.0.1'; // Change this if vMix is on another computer
const VMIX_TCP_PORT = 8099;

let mainWindow;
const client = new net.Socket();
let isVmixConnected = false;

// --- State variables for handling XMLTEXT responses ---
let xmlTextPromise = { resolve: null, reject: null };

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

// --- TCP Client Logic for real-time commands ---
function connectToVmix() {
    console.log(`Attempting to connect to vMix at ${VMIX_HOST}:${VMIX_TCP_PORT}`);
    client.connect(VMIX_TCP_PORT, VMIX_HOST, () => {
        console.log('Successfully connected to vMix TCP API.');
        isVmixConnected = true;
        // Automatically subscribe to TALLY events on connection
        console.log('Auto-subscribing to TALLY events.');
        client.write('SUBSCRIBE TALLY\r\n');
    });
}

client.on('data', (data) => {
  const dataStr = data.toString('utf8');
  const messages = dataStr.split('\r\n').filter(msg => msg.trim() !== '');

  for (const message of messages) {
    // Check if a promise is waiting for an XMLTEXT response
    if (xmlTextPromise.resolve && message.startsWith('XMLTEXT ')) {
      if (message.startsWith('XMLTEXT OK ')) {
        xmlTextPromise.resolve(message.substring(11)); // Resolve with the response text
      } else { // Assumes XMLTEXT ER
        xmlTextPromise.reject(new Error(message.substring(11))); // Reject with the error text
      }
      // Clear the promise handlers for the next request
      xmlTextPromise = { resolve: null, reject: null };
    } else {
      // It's a TALLY event or other general message, so forward it to the UI
      if (mainWindow) {
        mainWindow.webContents.send('from-vmix', message + '\r\n');
      }
    }
  }
});


client.on('close', () => {
  console.log('Connection to vMix closed. Reconnecting in 5 seconds...');
  isVmixConnected = false;
  setTimeout(connectToVmix, 5000);
});

client.on('error', (err) => {
  console.error('vMix TCP Connection Error:', err.message);
});


// --- Electron App Lifecycle ---
app.whenReady().then(() => {
  createWindow();
  connectToVmix();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC (Inter-Process Communication) ---
ipcMain.on('to-vmix', (event, command) => {
  if (isVmixConnected && command) {
    console.log(`Sending to vMix: ${command}`);
    client.write(command + '\r\n');
  } else if (!isVmixConnected) {
    console.warn('Cannot send command. vMix is not connected.');
    if (mainWindow) {
        mainWindow.webContents.send('from-vmix', 'ERROR: vMix not connected.\r\n');
    }
  }
});

// New handler for fetching a single input's name using XMLTEXT
ipcMain.handle('get-input-name', async (event, inputNumber) => {
  return new Promise((resolve, reject) => {
    if (!isVmixConnected) return reject(new Error('vMix not connected'));
    if (xmlTextPromise.resolve) return reject(new Error('Another name request is already in progress.'));

    // Set the global promise handlers that the client.on('data') handler will use
    xmlTextPromise = { resolve, reject };
    
    const xpath = `vmix/inputs/input[${inputNumber}]/@title`;
    client.write(`XMLTEXT ${xpath}\r\n`);

    // Set a timeout in case vMix doesn't respond
    setTimeout(() => {
      if (xmlTextPromise.reject) {
        xmlTextPromise.reject(new Error(`Timeout: No response for input ${inputNumber}`));
        xmlTextPromise = { resolve: null, reject: null }; // Clear handlers
      }
    }, 2000);
  });
});
