import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],

  optimizeDeps: {
    // Include the Svelte plugin so it’s pre-bundled
    include: ['@sveltejs/vite-plugin-svelte'],
    // Exclude lightningcss (Node-only, breaks in browser)
    exclude: ['lightningcss'],
    // Tell esbuild to allow top-level await
    esbuildOptions: {
      target: 'esnext'
    }
  },

  build: {
    // Also target ESNext for production builds
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true
  },

  resolve: {
    alias: {
      // Stub out lightningcss’s broken require("../pkg")
      '../pkg': path.resolve(__dirname, 'empty-lightningcss.js')
    }
  },

  base: './'
});
