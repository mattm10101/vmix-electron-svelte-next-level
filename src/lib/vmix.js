// src/lib/vmix.js

import { get } from 'svelte/store';
import {
  inputs,
  logMessages,
  programInput,
  previewInput,
  isMasterAudioMuted,
  masterVolume,
  playingInputs,
  overlay1ActiveInput,
} from './stores.js';

let logId = 0;
let fetchDebounceTimer = null;
let isFetching = false;

const isTargetInput = (input, identifier) =>
  String(input.id) === identifier ||
  input.key === identifier ||
  input.title === identifier;

export function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  logMessages.update((currentMessages) => {
    const newLog = [
      ...currentMessages,
      { id: logId++, timestamp, message, type },
    ];
    if (newLog.length > 200) return newLog.slice(newLog.length - 200);
    return newLog;
  });
}

export function sendCommand(command) {
  if (!window.electronAPI)
    return addLog('ERROR: electronAPI is not available.', 'error');
  window.electronAPI.sendCommand(command);
  addLog(`SENT: ${command}`, 'sent');
}

// --- NEW ROBUST fetchAllInputs FUNCTION ---
export function fetchAllInputs() {
  clearTimeout(fetchDebounceTimer);

  // If a fetch is already in progress, schedule another one for just after.
  // This ensures we always get the latest state after a burst of actions.
  if (isFetching) {
    fetchDebounceTimer = setTimeout(fetchAllInputs, 150);
    return;
  }

  isFetching = true;
  addLog('Fetching all inputs...', 'info');

  // Safety timeout to prevent the lock from getting stuck
  const fetchTimeout = setTimeout(() => {
    if (isFetching) {
      addLog('Fetch timeout reached, resetting lock.', 'error');
      isFetching = false;
    }
  }, 3000); // 3-second timeout

  window.electronAPI.getAllInputs()
    .then(fetchedInputs => {
      inputs.set(fetchedInputs || []);
      // Omit success log for fetch to reduce log spam
    })
    .catch(e => {
      // The error from the backend is already specific, use it directly.
      addLog(`Error fetching inputs: ${e.message}`, 'error');
      inputs.set([]);
    })
    .finally(() => {
      isFetching = false; // Release the lock
      clearTimeout(fetchTimeout); // Clear the safety timeout
    });
}


export function sendCommandAndRefresh(command) {
  sendCommand(command);
  // No longer a hardcoded timeout, just calls the debounced function
  fetchAllInputs();
}

export async function queryVmixXpath(xpath) {
  if (!window.electronAPI) {
    addLog('ERROR: electronAPI is not available.', 'error');
    return null;
  }
  try {
    const value = await window.electronAPI.queryVmixXpath(xpath);
    addLog(`XPATH RECV: ${xpath} = ${value}`, 'received');
    return value;
  } catch (e) {
    addLog(`Error in XPath query: ${e.message}`, 'error');
    return null;
  }
}

export function initializeVmixListener() {
  if (window.electronAPI) {
    window.electronAPI.receive((message) => {
      addLog(`RECV: ${message}`, 'received');

      const parts = message.split(' ');
      if (parts[0] !== 'ACTS' || parts[1] !== 'OK') return;

      const activator = parts[2];
      const identifier = parts[3];
      const state = parts.length > 4 ? parts[4] : undefined;

      switch (activator) {
        case 'Input':
          if (state === '1') {
            const targetInput = get(inputs).find(input => isTargetInput(input, identifier));
            programInput.set(targetInput ? targetInput.id : 0);
          } else {
            if (get(programInput) !== 0) {
                 const currentProgramInput = get(inputs).find(i => i.id === get(programInput));
                 if(currentProgramInput && isTargetInput(currentProgramInput, identifier)) {
                     programInput.set(0);
                 }
            }
          }
          break;

        case 'InputPreview':
          if (state === '1') {
            const targetInput = get(inputs).find(input => isTargetInput(input, identifier));
            previewInput.set(targetInput ? targetInput.id : 0);
          } else {
             if (get(previewInput) !== 0) {
                 const currentPreviewInput = get(inputs).find(i => i.id === get(previewInput));
                 if(currentPreviewInput && isTargetInput(currentPreviewInput, identifier)) {
                     previewInput.set(0);
                 }
            }
          }
          break;

        case 'InputPlaying':
          playingInputs.update((currentSet) => {
            const targetInput = get(inputs).find(input => isTargetInput(input, identifier));
            if (targetInput) {
              const newSet = new Set(currentSet);
              if (state === '1') {
                newSet.add(targetInput.id);
              } else {
                newSet.delete(targetInput.id);
              }
              return newSet;
            }
            return currentSet;
          });
          break
          
        case 'InputAudio':
          inputs.update((allInputs) =>
            allInputs.map(input => 
              isTargetInput(input, identifier) ? { ...input, muted: state === '0' } : input
            )
          );
          break;

        case 'InputVolume':
          inputs.update((allInputs) =>
            allInputs.map(input =>
              isTargetInput(input, identifier) ? { ...input, volume: Math.round(parseFloat(state) ** 0.25 * 100) } : input
            )
          );
          break
        
        case 'InputSelectedIndex':
          inputs.update((allInputs) =>
            allInputs.map(input =>
              isTargetInput(input, identifier) ? { ...input, selectedIndex: parseInt(state, 10) } : input
            )
          );
          break;

        case 'Overlay1':
          overlay1ActiveInput.set(state === '1' ? parseInt(identifier, 10) : 0)
          break;
        case 'MasterAudio':
          isMasterAudioMuted.set(identifier === '0')
          break;
        case 'MasterVolume':
          masterVolume.set(Math.round(parseFloat(identifier) ** 0.25 * 100))
          break;
      }
    })
    addLog('vMix Activator listener initialized.', 'info')
  }
}