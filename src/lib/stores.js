import { writable } from 'svelte/store'

/**
 * @type {import('svelte/store').Writable<Array<{id: number, name: string}>>}
 */
export const inputs = writable([])

/**
 * @type {import('svelte/store').Writable<Array<{timestamp: string, message: string, type: string}>>}
 */
export const logMessages = writable([])

/**
 * @type {import('svelte/store').Writable<Object<string, {x: number, y: number, width: number, height: number, z: number, min: boolean}>>}
 */
export const panelStates = writable({})

export const programInput = writable(0)
export const previewInput = writable(0)
export const isMasterAudioMuted = writable(false)

// NEW: Store for saved layout presets
export const layoutPresets = writable([])
