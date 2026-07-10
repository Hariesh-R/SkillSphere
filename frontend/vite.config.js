import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to the Express backend during development.
      // This avoids CORS issues in the browser without changing any fetch URL.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy /uploads so image URLs resolve correctly in dev
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
