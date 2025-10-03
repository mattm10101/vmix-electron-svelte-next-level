// src/lib/stores.js

import { writable, derived, get } from 'svelte/store'
import { persistentStore } from './persistentStore.js'
import { defaultLayout } from './defaultLayout.js'

// --- Core vMix State ---
export const inputs = writable([])
export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)
export const masterVolume = writable(100)
export const playingInputs = writable(new Set())
export const overlay1ActiveInput = writable(0)

// --- UI & Application State ---
export const logMessages = writable([])
export const inputMappings = persistentStore('inputMappings', {
  music: 'LIST - MUSIC',
  videos: 'LIST - VIDEOS',
  photos: 'PHOTOS - ',
  lowerThirds: 'L3 - ',
})
export const savedDefaultLayout = persistentStore('savedDefaultLayout', null)
export const panelStates = persistentStore(
  'panelStates',
  get(savedDefaultLayout) || defaultLayout
)
export const layoutPresets = persistentStore('layoutPresets', [])
export const scriptManager = persistentStore('scriptManager', {
  scripts: [
    { id: 1, name: 'Script 1' },
    { id: 2, name: 'Script 2' },
  ],
  layout: 2,
})
export const visibilityOptions = persistentStore('visibilityOptions', {
  showNumbers: true,
  showL3s: true,
  showPreviewLed: true,
})
export const gridOptions = persistentStore('gridOptions', {
  show: true,
  snapSize: 10,
  snapToGrid: true,
  snapResize: true,
})

// --- UI Interaction Stores ---
export const marquee = writable({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})
export const selectedPanelIds = writable(new Set())
export const modalStore = writable({
  isOpen: false,
  message: '',
  onConfirm: () => {},
})
// NEW: A store to control the visibility of our new Preferences modal
export const optionsModalOpen = writable(false);


// --- Derived Stores ---
export const l3Inputs = derived(
  [inputs, inputMappings],
  ([$inputs, $mappings]) => {
    if (!$mappings.lowerThirds) return []
    return $inputs.filter((input) => input.title.startsWith($mappings.lowerThirds))
  }
)

// Helper function to show the modal
export function showModal(message, onConfirm) {
  modalStore.set({
    isOpen: true,
    message,
    onConfirm,
  })
}