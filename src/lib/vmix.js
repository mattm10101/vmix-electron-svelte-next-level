// src/lib/vmix.js

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

// NEW: This function combines sending a command with immediately refreshing the data.
// This is the implementation of your idea.
export function sendCommandAndRefresh(command) {
  sendCommand(command);
  // We add a small delay to give vMix a moment to process the command before we ask for the new XML.
  setTimeout(() => {
    fetchAllInputs();
  }, 100); // 100ms delay
}

export async function queryVmixXpath(xpath) {
  // This function remains unchanged
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
      const identifier = parts[3]
      const state = parts.length > 4 ? parts[4] : undefined

      const isTargetInput = (input) =>
        String(input.id) === identifier ||
        input.key === identifier ||
        input.title === identifier;

      switch (activator) {
        case 'Input':
          programInput.set(state === '1' ? parseInt(identifier, 10) : 0)
          break

        case 'InputPreview':
          previewInput.set(state === '1' ? parseInt(identifier, 10) : 0)
          break

        // We will still listen for Play/Pause state as it's very responsive.
        case 'InputPlaying':
          playingInputs.update((currentSet) => {
            const targetInput = get(inputs).find(isTargetInput);
            if (targetInput) {
              state === '1'
                ? currentSet.add(targetInput.id)
                : currentSet.delete(targetInput.id);
            }
            return new Set(currentSet);
          });
          break
        
        // We no longer need to listen for SelectedIndex, Audio, or Volume,
        // as the full refresh will catch these changes. This simplifies our listener.

        case 'Overlay1':
          overlay1ActiveInput.set(state === '1' ? parseInt(identifier, 10) : 0)
          break
        case 'MasterAudio':
          isMasterAudioMuted.set(identifier === '0')
          break
      }
    })
    addLog('vMix Activator listener initialized.', 'info')
  }
}