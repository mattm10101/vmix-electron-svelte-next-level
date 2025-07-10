import { writable } from 'svelte/store'

/**
 * Creates a Svelte store that automatically persists its value to localStorage.
 * @param {string} key The key to use in localStorage.
 * @param {any} initialValue The initial value of the store if nothing is in localStorage.
 * @returns A Svelte writable store.
 */
export function persistentStore(key, initialValue) {
  let initialData = initialValue
  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue) {
      initialData = JSON.parse(storedValue)
    }
  } catch {
    // If parsing fails, fall back to the initial value
    initialData = initialValue
  }

  const store = writable(initialData)

  store.subscribe((value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save to localStorage for key "${key}"`, error)
    }
  })

  return store
}
