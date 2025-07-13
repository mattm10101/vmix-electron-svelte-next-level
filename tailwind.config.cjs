/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{html,js,svelte}',
    './electron/**/*.{js,cjs}',
  ],
  theme: {
    extend: {
      colors: {
        lab: {
          metal: '#1f1f23',
          panel: '#2a2a2e',
          accent: '#14ffec',
          header: '#151518',
        },
        neon: {
          teal: '#14ffec',
          blue: '#00d0ff',
        },
      },
      boxShadow: {
        panel: '0 4px 12px rgba(0,0,0,0.6)',
        glow: '0 0 8px rgba(20,255,236,0.6), 0 0 16px rgba(0,208,255,0.4)',
      },
      fontFamily: {
        sci: ["'Share Tech Mono'", 'monospace'],
      },
    },
  },
}
