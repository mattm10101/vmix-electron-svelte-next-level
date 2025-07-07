// src/main.js (or renderer.js)
import '../src/app.css';   // ← ensure this path points at your Tailwind entry
import App from './App.svelte';

const app = new App({
  target: document.body
});

export default app;
