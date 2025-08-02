import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Try to prevent esbuild service issues
    keepNames: true,
    target: 'es2020'
  },
  optimizeDeps: {
    // Force esbuild to restart
    force: true
  },
  server: {
    // Add server configuration to help with stability
    hmr: {
      overlay: false
    }
  }
})
