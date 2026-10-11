import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/** Identificador único de cada build, comparado pelo app com /version.json. */
const VERSAO_APP = Date.now().toString(36)

/** Publica /version.json no build para as abas abertas detectarem deploy novo. */
function versaoApp(): Plugin {
  return {
    name: 'versao-app',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ versao: VERSAO_APP }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versaoApp()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL ?? 'https://casadiana-api.onrender.com/api'
    ),
    __VERSAO_APP__: JSON.stringify(VERSAO_APP),
  },
})
