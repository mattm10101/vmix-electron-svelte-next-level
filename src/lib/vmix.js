import { inputs, logMessages, programInput, previewInput } from './stores.js'

// Add a simple counter to generate unique IDs for log messages
let logId = 0

// --- Command Sending and Logging ---

export function sendCommand(command) {
  if (window.electronAPI) {
    window.electronAPI.send(command)
    addLog(`SENT: ${command}`, 'sent')
  }
}

export function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  logMessages.update((currentMessages) => {
    // Add the new message with a unique ID
    currentMessages.push({ id: logId++, timestamp, message, type })

    // If the array is too long, remove the oldest item
    if (currentMessages.length > 200) {
      currentMessages.shift()
    }

    // Return the mutated array to trigger the update
    return currentMessages
  })
}

// --- Data Fetching ---

export async function fetchAllInputNames(maxInputs = 50) {
  addLog(`Fetching up to ${maxInputs} input names...`, 'info')
  if (!window.electronAPI) return

  const fetchedInputs = []
  for (let i = 1; i <= maxInputs; i++) {
    try {
      const name = await window.electronAPI.getInputName(i)
      if (name) {
        fetchedInputs.push({ id: i, name })
      }
    } catch (e) {
      addLog(`Stopping input search at ${i - 1}.`, 'info')
      break
    }
  }
  inputs.set(fetchedInputs)
  addLog(`Found ${fetchedInputs.length} inputs.`, 'info')
}

// --- Event Listening ---

export function initializeVmixListener() {
  if (window.electronAPI) {
    window.electronAPI.receive((message) => {
      addLog(`RECV: ${message}`, 'received')

      if (message.startsWith('ACTS OK ')) {
        const parts = message.split(' ')
        if (parts.length < 5) return

        const activator = parts[2]
        const inputNum = parseInt(parts[3], 10)
        const state = parts[4]

        if (activator === 'Input') {
          programInput.set(state === '1' ? inputNum : 0)
        } else if (activator === 'InputPreview') {
          previewInput.set(state === '1' ? inputNum : 0)
        }
      }
    })
    addLog('vMix Activator listener initialized.', 'info')
  }
}
