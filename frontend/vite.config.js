import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2520,
    proxy: {
      '/api': {
        target: 'https://quiz-platform-6whj.onrender.com',
        changeOrigin: true,
      },
      '/static': {
        target: 'https://quiz-platform-6whj.onrender.com',
        changeOrigin: true,
      },
      '/ws': {
        target: 'wss://quiz-platform-6whj.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
