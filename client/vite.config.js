import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Priority 6 — vendor chunk split. Route-level lazy() in App.jsx already
    // splits each page into its own chunk; this additionally pulls out
    // rarely-changing vendor code (React, Router) into a separate chunk so
    // it's cached long-term by the browser instead of being re-downloaded
    // whenever app code changes.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    minify: 'esbuild',
  },
  esbuild: {
    // Drop console/debugger statements from the production build —
    // also addresses the "browser errors logged to console" Best Practices
    // finding where leftover console.* calls surface as noisy console output.
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))