import { writable, derived } from 'svelte/store'
import { persistentStore } from './persistentStore.js'
import { defaultLayout } from './defaultLayout.js'

// --- Core vMix State ---
export const inputs = writable([])
export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)
export const masterVolume = writable(100)
export const playingInputs = writable(new Set())

// --- UI & Application State ---
export const logMessages = writable([])
export const panelStates = persistentStore('panelStates', defaultLayout)
export const layoutPresets = persistentStore('layoutPresets', [])
export const scriptManager = persistentStore('scriptManager', {
  scripts: [
    { id: 1, name: 'Script 1' },
    { id: 2, name: 'Script 2' },
  ],
  layout: 2,
})

// --- UI Interaction Stores ---
export const marquee = writable({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})
// TYPO FIX: Changed selectedPanelLIds to selectedPanelIds
export const selectedPanelIds = writable(new Set())
export const overlay1ActiveInput = writable(0)
export const visibilityOptions = persistentStore('visibilityOptions', {
  showNumbers: true,
  showL3s: true,
  showPreviewLed: true,
})

// --- Derived Stores ---
export const l3Inputs = derived(inputs, ($inputs) =>
  $inputs.filter((input) => input.title.startsWith('L3 -'))
)
