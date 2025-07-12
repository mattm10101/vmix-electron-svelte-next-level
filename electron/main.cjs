const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')
const VmixConnector = require('./VmixConnector.cjs')

const VMIX_HOST = '127.0.0.1'
const VMIX_TCP_PORT = 8099

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  const vmixConnector = new VmixConnector(VMIX_HOST, VMIX_TCP_PORT, mainWindow)
  vmixConnector.connect()

  // Set up all communication channels AFTER the connector is created
  ipcMain.on('to-vmix', (_, command) => {
    vmixConnector.sendCommand(command)
  })

  ipcMain.handle('get-all-inputs', async () => {
    try {
      const xmlData = await vmixConnector.queryXml()
      if (!xmlData) {
        console.error('Received empty XML data from vMix.')
        return []
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      })
      const vmixObj = parser.parse(xmlData)

      if (!vmixObj || !vmixObj.vmix || !vmixObj.vmix.inputs) {
        console.log('No <inputs> tag found in vMix XML. Assuming no inputs.')
        return []
      }

      let inputs = vmixObj.vmix.inputs.input
      if (!inputs) return []
      if (!Array.isArray(inputs)) inputs = [inputs]

      return inputs
    } catch (error) {
      console.error('Failed to get all inputs:', error)
      return []
    }
  })

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
