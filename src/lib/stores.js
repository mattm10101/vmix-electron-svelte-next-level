import { writable, derived } from 'svelte/store'
import { persistentStore } from './persistentStore.js'
import { defaultLayout } from './defaultLayout.js'

export const inputs = writable([])
export const logMessages = writable([])
export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)
export const masterVolume = writable(100)

// These stores are now initialized with our master default layout
export const panelStates = persistentStore('panelStates', defaultLayout)
export const layoutPresets = persistentStore('layoutPresets', [])

export const scriptManager = persistentStore('scriptManager', {
  scripts: [
    { id: 1, name: 'Script 1' },
    { id: 2, name: 'Script 2' },
    { id: 3, name: 'Script 3' },
    { id: 4, name: 'Script 4' },
  ],
  layout: 2,
})

export const visibilityOptions = persistentStore('visibilityOptions', {
  showNumbers: true,
  showL3s: true,
  show1Ups: true,
  show2Ups: true,
  show3Ups: true,
  show4Ups: true,
  showPreviewLed: true,
})

export const marquee = writable({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})
export const selectedPanelIds = writable(new Set())
export const overlay1ActiveInput = writable(0)

export const l3Inputs = derived(inputs, ($inputs) =>
  $inputs.filter((input) => input.name.startsWith('L3 -'))
)
