// electron/main.cjs

// 1) Import Electron and Node modules
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

// 2) vMix TCP settings
const VMIX_HOST = '127.0.0.1';
const VMIX_TCP_PORT = 8099;

// 3) State
let mainWindow;
const client = new net.Socket();
let isVmixConnected = false;
let xmlTextPromise = { resolve: null, reject: null };

// 4) Create the BrowserWindow and load URL
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      // preload can expose electronAPI to renderer
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const isDev = !app.isPackaged;
  const appUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(appUrl);
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// 5) Connect to vMix TCP for tally & XMLTEXT
function connectToVmix() {
  client.connect(VMIX_TCP_PORT, VMIX_HOST, () => {
    console.log('vMix TCP Connected');
    isVmixConnected = true;
    client.write('SUBSCRIBE TALLY\r\n');
  });
}

// 6) Handle incoming TCP data
client.on('data', (data) => {
  const messages = data.toString('utf8').split('\r\n').filter(msg => msg);
  for (const message of messages) {
    if (xmlTextPromise.resolve && message.startsWith('XMLTEXT ')) {
      // Resolve XMLTEXT promise
      if (message.startsWith('XMLTEXT OK ')) {
        xmlTextPromise.resolve(message.substring(11));
      } else {
        xmlTextPromise.reject(new Error(message.substring(11)));
      }
      xmlTextPromise = { resolve: null, reject: null };
    } else {
      mainWindow.webContents.send('from-vmix', message);
    }
  }
});

// 7) Reconnect on close/error
client.on('close', () => {
  isVmixConnected = false;
  setTimeout(connectToVmix, 5000);
});
client.on('error', (err) => console.error('vMix TCP Error:', err.message));

// 8) App lifecycle
app.whenReady().then(() => {
  createWindow();
  connectToVmix();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 9) IPC handlers to/from renderer
ipcMain.on('to-vmix', (_, command) => {
  if (isVmixConnected) {
    client.write(command + '\r\n');
  }
});

ipcMain.handle('get-input-name', (_, inputNumber) => {
  return new Promise((resolve, reject) => {
    if (!isVmixConnected) {
      return reject(new Error('vMix not connected'));
    }
    if (xmlTextPromise.resolve) {
      return reject(new Error('Request in progress'));
    }

    xmlTextPromise = { resolve, reject };
    const xpath = `vmix/inputs/input[${inputNumber}]/@title`;
    client.write(`XMLTEXT ${xpath}\r\n`);

    // Timeout after 1s
    setTimeout(() => {
      if (xmlTextPromise.reject) {
        xmlTextPromise.reject(new Error(`Timeout for input ${inputNumber}`));
        xmlTextPromise = { resolve: null, reject: null };
      }
    }, 1000);
  });
});
