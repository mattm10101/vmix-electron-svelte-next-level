import { writable } from 'svelte/store'

export function persistentStore(key, initialValue) {
  let initialData = initialValue
  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue) {
      initialData = JSON.parse(storedValue)
    }
  } catch {
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
