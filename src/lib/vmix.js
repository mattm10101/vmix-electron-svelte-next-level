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

export async function fetchAllInputs() {
  if (!window.electronAPI)
    return addLog('ERROR: electronAPI is not available.', 'error');
  addLog('Fetching all inputs...', 'info');
  try {
    const fetchedInputs = await window.electronAPI.getAllInputs();
    inputs.set(fetchedInputs || []);
    addLog(`Found ${fetchedInputs.length || 0} inputs.`, 'info');
  } catch (e) {
    addLog(`Error fetching inputs: ${e.message}`, 'error');
    inputs.set([]);
  }
}

export function sendCommandAndRefresh(command) {
  sendCommand(command);
  setTimeout(() => {
    fetchAllInputs();
  }, 100);
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
        // UPDATED: This case is now robust, just like the others.
        case 'Input':
          if (state === '1') {
            const targetInput = get(inputs).find(input => isTargetInput(input, identifier));
            programInput.set(targetInput ? targetInput.id : 0);
          } else {
            // If state is 0, it means the input is no longer in program.
            // We can check if the current programInput matches to clear it.
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