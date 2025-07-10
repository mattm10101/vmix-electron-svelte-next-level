import { writable } from 'svelte/store'
import { persistentStore } from './persistentStore.js'

// --- Core Stores ---
export const inputs = writable([])
export const logMessages = writable([])
export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)

// --- Persistent Stores ---
// These stores will now automatically save and load from localStorage
export const panelStates = persistentStore('panelStates', {})
export const layoutPresets = persistentStore('layoutPresets', [])

// --- Consolidated Visibility Options ---
// All filter toggles are now properties on a single store object
export const visibilityOptions = persistentStore('visibilityOptions', {
  showNumbers: true,
  showL3s: true,
  show1Ups: true,
  show2Ups: true,
  show3Ups: true,
  show4Ups: true,
})
