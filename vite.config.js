import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react'
    }),
    tailwindcss(),
  ],
  build: {
    outDir: 'assets/static',
    emptyOutDir: false, // Don't clear the directory since we have other static files
    rollupOptions: {
      input: {
        main: 'src/client/index.tsx'
      },
      output: {
        entryFileNames: 'index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'main.css') {
            return 'styles.css'
          }
          return '[name].[ext]'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 