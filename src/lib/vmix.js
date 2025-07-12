import {
  inputs,
  logMessages,
  programInput,
  previewInput,
  isMasterAudioMuted,
  masterVolume,
  playingInputs,
} from './stores.js'

let logId = 0

// This function now sends commands to our new Web API handler
export function sendCommand(command) {
  if (window.electronAPI) {
    window.electronAPI.sendCommand(command)
    addLog(`SENT: ${command}`, 'sent')
  }
}

export function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  logMessages.update((currentMessages) => {
    currentMessages.push({ id: logId++, timestamp, message, type })
    if (currentMessages.length > 200) {
      currentMessages.shift()
    }
    return currentMessages
  })
}

// Fetches all inputs via the new backend function
export async function fetchAllInputs() {
  addLog('Fetching all inputs...', 'info')
  if (!window.electronAPI) return

  try {
    const fetchedInputs = await window.electronAPI.getAllInputs()
    const processedInputs = fetchedInputs.map((input) => ({
      ...input,
      id: parseInt(input.number, 10),
      name: input.title,
      shortTitle: input.shortTitle || input.title,
    }))
    inputs.set(processedInputs || [])
    addLog(`Found ${processedInputs.length || 0} inputs.`, 'info')
  } catch (e) {
    addLog(`Error fetching inputs: ${e.message}`, 'error')
    inputs.set([])
  }
}

// The real-time listener is unchanged
export function initializeVmixListener() {
  if (window.electronAPI) {
    window.electronAPI.receive((message) => {
      addLog(`RECV: ${message}`, 'received')
      if (message.startsWith('ACTS OK ')) {
        const parts = message.split(' ')
        if (parts.length === 4 && parts[2] === 'MasterAudio') {
          isMasterAudioMuted.set(parts[3] === '0')
          return
        }
        if (parts.length === 4 && parts[2] === 'MasterVolume') {
          masterVolume.set(Math.round(parseFloat(parts[3]) ** 0.25 * 100))
          return
        }
        if (parts.length >= 5) {
          const activator = parts[2]
          const inputNum = parseInt(parts[3], 10)
          const state = parts[4]
          if (activator === 'Input') {
            programInput.set(state === '1' ? inputNum : 0)
          } else if (activator === 'InputPreview') {
            previewInput.set(state === '1' ? inputNum : 0)
          } else if (activator === 'InputPlaying') {
            playingInputs.update((currentSet) => {
              state === '1'
                ? currentSet.add(inputNum)
                : currentSet.delete(inputNum)
              return currentSet
            })
          }
        }
      }
    })
    addLog('vMix Activator listener initialized.', 'info')
  }
}
