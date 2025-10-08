// electron/main.cjs

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const http = require('http'); // For VU Meter Polling
const { XMLParser } = require('fast-xml-parser');
const VmixConnector = require('./VmixConnector.cjs');

const VMIX_HOST = '127.0.0.1';
const VMIX_TCP_PORT = 8099;
const VMIX_HTTP_PORT = 8088; // Port for Web API / VU Meters

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
  { id: 'slides', label: 'Slides Player' },
  { id: 'lowerThirds', label: 'Lower Thirds' },
  { id: 'inputOptions', label: 'Input Options' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'log', label: 'Command Log' },
];

// --- CORRECTED VU POLLING FUNCTION ---
function startVuPolling(window) {
    if (!window) return;
    console.log('✅ Starting vMix VU Polling (Corrected) on port 8088...');

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    setInterval(() => {
        const req = http.get(`http://${VMIX_HOST}:${VMIX_HTTP_PORT}/api`, (res) => {
            const { statusCode } = res;
            if (statusCode !== 200) {
                res.resume();
                return;
            }

            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const vmixObj = parser.parse(data);
                    if (!vmixObj?.vmix) return;

                    // 1. Get Master Levels from the <audio> tag
                    const masterAudio = vmixObj.vmix.audio?.master;

                    // 2. Get All Inputs from the main <inputs> tag
                    let allInputs = vmixObj.vmix.inputs?.input || [];
                    if (!Array.isArray(allInputs)) allInputs = [allInputs];

                    // 3. Build the payload from the correct locations
                    const vuData = {
                        master: {
                            f1: parseFloat(masterAudio?.meterF1 || 0),
                            f2: parseFloat(masterAudio?.meterF2 || 0)
                        },
                        inputs: {}
                    };

                    // 4. Loop through the MAIN inputs list to find meter data
                    for (const input of allInputs) {
                        if (input.meterF1 !== undefined || input.meterF2 !== undefined) {
                            vuData.inputs[input.key] = {
                                f1: parseFloat(input.meterF1 || 0),
                                f2: parseFloat(input.meterF2 || 0)
                            };
                        }
                    }
                    
                    if (!window.isDestroyed()) {
                        window.webContents.send('vmix-vu-data', vuData);
                    }
                } catch (e) {
                    // console.error('Error parsing VU meter XML:', e.message);
                }
            });
        });

        req.on('error', (e) => {
           // Suppress frequent errors
        });

        req.end();
    }, 100);
}


const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click() {
          if (mainWindow) {
            mainWindow.webContents.send('open-options-modal');
          }
        },
      },
      { type: 'separator' },
      { role: 'quit' },
    ],
  },
  {
    label: 'View',
    submenu: toggleablePanels.map((panel) => ({
      id: panel.id,
      label: `Show ${panel.label} Panel`,
      type: 'checkbox',
      checked: true,
      click(menuItem) {
        if (mainWindow) {
          mainWindow.webContents.send('toggle-panel-visibility', menuItem.id);
        }
      },
    })),
  },
  {
    label: 'Developer',
    submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }],
  },
];

ipcMain.on('update-menu-state', (event, panelStates) => {
  const viewMenu = menuTemplate.find((m) => m.label === 'View');
  if (viewMenu) {
    viewMenu.submenu.forEach((submenuItem) => {
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
  });

  const vmixConnector = new VmixConnector(VMIX_HOST, VMIX_TCP_PORT, mainWindow);
  vmixConnector.connect();

  startVuPolling(mainWindow);

  ipcMain.on('to-vmix', (_, command) => {
    vmixConnector.sendCommand(command);
  });

  ipcMain.handle('query-xpath', async (_, xpath) => {
    try {
      return await vmixConnector.queryXpath(xpath);
    } catch (error) {
      console.error(`XPath query failed for "${xpath}":`, error);
      return null;
    }
  });

  ipcMain.handle('get-all-inputs', async () => {
    try {
      const xmlData = await vmixConnector.queryXml();
      if (!xmlData) return [];

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const vmixObj = parser.parse(xmlData);

      if (!vmixObj?.vmix?.inputs?.input) return [];
      let inputs = vmixObj.vmix.inputs.input;
      if (!Array.isArray(inputs)) inputs = [inputs];

      return inputs.map((input) => {
        let items = [];
        if (input.list && input.list.item) {
          const rawItems = Array.isArray(input.list.item)
            ? input.list.item
            : [input.list.item];
          items = rawItems.map((item, index) => {
            const isObject = typeof item === 'object' && item !== null;
            const itemName = isObject ? item['#text'] : item;
            return {
              id: `${input.key}-${index}`,
              name: path.basename(itemName || ''),
              selected: isObject ? item.selected === 'true' : false,
            };
          });
        }

        const processedInput = {
          id: parseInt(input.number, 10),
          key: input.key,
          title: input.title,
          shortTitle: input.shortTitle || input.title,
          state: input.state,
          selectedIndex: parseInt(input.selectedIndex, 10),
          list: items,
        };
        if (input.muted !== undefined) {
          processedInput.muted = String(input.muted).toLowerCase() === 'true';
        }

        if (input.volume !== undefined) {
          processedInput.volume = parseFloat(input.volume);
        }

        return processedInput;
      });
    } catch (error) {
      console.error('Failed to get all inputs:', error);
      return [];
    }
  });

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const isDev = !app.isPackaged;
  const appUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(appUrl);
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});