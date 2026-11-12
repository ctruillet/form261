import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cible de l'API : configurable (ex. API_URL=http://localhost:5055) si le backend
      // est lancé sur un autre port via la variable PORT
      '/api': process.env.API_URL || 'http://localhost:5000',
    },
  },
})
