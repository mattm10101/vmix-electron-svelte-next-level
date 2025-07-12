const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const VmixConnector = require('./VmixConnector.cjs')

const VMIX_HOST = '127.0.0.1'
const VMIX_TCP_PORT = 8099

let mainWindow
let vmixConnector

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  vmixConnector = new VmixConnector(VMIX_HOST, VMIX_TCP_PORT, mainWindow)
  vmixConnector.connect()

  const isDev = !app.isPackaged
  const appUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(appUrl)
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('to-vmix', (_, command) => {
  vmixConnector.sendCommand(command)
})

ipcMain.handle('get-input-name', async (_, inputNumber) => {
  const xpath = `vmix/inputs/input[${inputNumber}]/@title`
  return await vmixConnector.queryXmlText(xpath)
})
