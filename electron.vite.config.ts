import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve('electron/main.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve('electron/preload.ts'),
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
    root: resolve('src/renderer'),
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
      },
    },
    build: {
      outDir: resolve('out/renderer'),
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
        },
      },
    },
  },
})
