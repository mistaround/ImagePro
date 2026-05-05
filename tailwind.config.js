/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0e0e16',
        surface: '#14141f',
        panel: '#1a1a28',
        border: '#252535',
        'border-2': '#2e2e45',
        accent: '#6c63ff',
        muted: '#8888a8',
        dim: '#444460',
      },
    },
  },
  plugins: [],
}
