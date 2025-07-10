// src/main.js
import './app.css'
import { mount } from 'svelte' // Import the new 'mount' function
import App from './App.svelte'

// Mount the app using the new Svelte 5 API
const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
