import { get } from 'svelte/store'
import {
  inputs,
  logMessages,
  programInput,
  previewInput,
  isMasterAudioMuted,
  masterVolume,
  playingInputs,
  overlay1ActiveInput,
} from './stores.js'

let logId = 0

export function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  logMessages.update((currentMessages) => {
    const newLog = [
      ...currentMessages,
      { id: logId++, timestamp, message, type },
    ]
    if (newLog.length > 200) return newLog.slice(newLog.length - 200)
    return newLog
  })
}

export function sendCommand(command) {
  if (!window.electronAPI)
    return addLog('ERROR: electronAPI is not available.', 'error')
  window.electronAPI.sendCommand(command)
  addLog(`SENT: ${command}`, 'sent')
}

export async function fetchAllInputs() {
  if (!window.electronAPI)
    return addLog('ERROR: electronAPI is not available.', 'error')
  addLog('Fetching all inputs...', 'info')
  try {
    const fetchedInputs = await window.electronAPI.getAllInputs()
    inputs.set(fetchedInputs || [])
    addLog(`Found ${fetchedInputs.length || 0} inputs.`, 'info')
  } catch (e) {
    addLog(`Error fetching inputs: ${e.message}`, 'error')
    inputs.set([])
  }
}

export async function queryVmixXpath(xpath) {
  if (!window.electronAPI) {
    addLog('ERROR: electronAPI is not available.', 'error')
    return null
  }
  try {
    const value = await window.electronAPI.queryXpath(xpath)
    addLog(`XPATH RECV: ${xpath} = ${value}`, 'received')
    return value
  } catch (e) {
    addLog(`Error in XPath query: ${e.message}`, 'error')
    return null
  }
}

export function initializeVmixListener() {
  if (window.electronAPI) {
    window.electronAPI.receive((message) => {
      addLog(`RECV: ${message}`, 'received')

      const parts = message.split(' ')
      if (parts[0] !== 'ACTS' || parts[1] !== 'OK') return

      const activator = parts[2]
      const value = parts[3]
      const state = parts.length > 4 ? parts[4] : undefined

      switch (activator) {
        case 'Input':
          programInput.set(state === '1' ? parseInt(value, 10) : 0)
          break

        // FIXED: This now correctly parses the value as a number, just like the 'Input' case.
        case 'InputPreview':
          previewInput.set(state === '1' ? parseInt(value, 10) : 0)
          break

        case 'InputPlaying':
          playingInputs.update((currentSet) => {
            const inputNum = parseInt(value, 10)
            state === '1'
              ? currentSet.add(inputNum)
              : currentSet.delete(inputNum)
            return new Set(currentSet)
          })
          break
        case 'InputAudio':
          inputs.update((currentInputs) => {
            const inputNum = parseInt(value, 10)
            const targetInput = currentInputs.find((i) => i.id === inputNum)
            if (targetInput) {
              targetInput.muted = state === '0'
            }
            return currentInputs
          })
          break
        case 'Overlay1':
          overlay1ActiveInput.set(state === '1' ? parseInt(value, 10) : 0)
          break
        case 'MasterAudio':
          isMasterAudioMuted.set(value === '0')
          break
        case 'MasterVolume':
          masterVolume.set(Math.round(parseFloat(value) ** 0.25 * 100))
          break
      }
    })
    addLog('vMix Activator listener initialized.', 'info')
  }
}
