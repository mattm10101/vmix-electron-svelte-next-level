import { writable } from 'svelte/store'
import { persistentStore } from './persistentStore.js'

export const inputs = writable([])
export const logMessages = writable([])
export const panelStates = persistentStore('panelStates', {})
export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)
export const layoutPresets = persistentStore('layoutPresets', [])

export const visibilityOptions = persistentStore('visibilityOptions', {
  showNumbers: true,
  showL3s: true,
  show1Ups: true,
  show2Ups: true,
  show3Ups: true,
  show4Ups: true,
  showPreviewLed: true,
})
