// electron/main.cjs

const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')
const VmixConnector = require('./VmixConnector.cjs')

const VMIX_HOST = '127.0.0.1'
const VMIX_TCP_PORT = 8099

let mainWindow;

const toggleablePanels = [
    { id: 'inputs', label: 'Inputs' },
    { id: 'transitions', label: 'Transitions' },
    { id: 'audio', label: 'Audio' },
    { id: 'presets', label: 'Presets' },
    { id: 'options', label: 'Options' },
    { id: 'music', label: 'Music Player' },
    { id: 'videos', label: 'Videos Player' },
    { id: 'photos', label: 'Photos Player' },
    { id: 'lowerThirds', label: 'Lower Thirds' },
    { id: 'inputOptions', label: 'Input Options' },
    { id: 'scripts', label: 'Scripts' },
    { id: 'log', label: 'Command Log' },
];

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      // NEW: Added a menu item to open our preferences/options modal
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,', // Standard keyboard shortcut
        click() {
          if (mainWindow) {
            mainWindow.webContents.send('open-options-modal');
          }
        }
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: toggleablePanels.map(panel => ({
      id: panel.id,
      label: `Show ${panel.label} Panel`,
      type: 'checkbox',
      checked: true,
      click(menuItem) {
        if (mainWindow) {
          mainWindow.webContents.send('toggle-panel-visibility', menuItem.id);
        }
      }
    }))
  },
  {
    label: 'Developer',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' }
    ]
  }
];

ipcMain.on('update-menu-state', (event, panelStates) => {
  const viewMenu = menuTemplate.find(m => m.label === 'View');
  if (viewMenu) {
    viewMenu.submenu.forEach(submenuItem => {
      const panelId = submenuItem.id;
      if (panelStates[panelId]) {
        submenuItem.checked = panelStates[panelId].visible;
      }
    });
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }
});


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  const vmixConnector = new VmixConnector(VMIX_HOST, VMIX_TCP_PORT, mainWindow)
  vmixConnector.connect()

  ipcMain.on('to-vmix', (_, command) => {
    vmixConnector.sendCommand(command)
  })

  ipcMain.handle('query-xpath', async (_, xpath) => {
    try {
      return await vmixConnector.queryXpath(xpath)
    } catch (error) {
      console.error(`XPath query failed for "${xpath}":`, error)
      return null
    }
  })

  ipcMain.handle('get-all-inputs', async () => {
    try {
      const xmlData = await vmixConnector.queryXml()
      if (!xmlData) return []

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      })
      const vmixObj = parser.parse(xmlData)

      if (!vmixObj?.vmix?.inputs?.input) return []
      let inputs = vmixObj.vmix.inputs.input
      if (!Array.isArray(inputs)) inputs = [inputs]

      return inputs.map((input) => {
        let items = []
        if (input.list && input.list.item) {
          const rawItems = Array.isArray(input.list.item)
            ? input.list.item
            : [input.list.item]
          items = rawItems.map((item, index) => {
            const isObject = typeof item === 'object' && item !== null
            const itemName = isObject ? item['#text'] : item
            return {
              id: `${input.key}-${index}`,
              name: path.basename(itemName || ''),
              selected: isObject ? item.selected === 'true' : false,
            }
          })
        }
        return {
          id: parseInt(input.number, 10),
          key: input.key,
          title: input.title,
          shortTitle: input.shortTitle || input.title,
          state: input.state,
          muted: String(input.muted).toLowerCase() === 'true',
          selectedIndex: parseInt(input.selectedIndex, 10),
          volume: input.volume !== undefined ? parseFloat(input.volume) : 100,
          list: items,
        }
      })
    } catch (error) {
      console.error('Failed to get all inputs:', error)
      return []
    }
  })

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

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