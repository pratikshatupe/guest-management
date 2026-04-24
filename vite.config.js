import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Split vendor libraries so the first-paint bundle stays small and cache-friendly:
 *   - react core is stable and shared by every route → its own chunk
 *   - recharts is only used by Dashboards → isolate so pages without charts skip it
 *   - router/icons split similarly to avoid re-downloading when only app code changes
 */
export default defineConfig({
  base: '/',
  plugins: [react()],
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom'],
          'router-vendor':  ['react-router-dom'],
          'charts-vendor':  ['recharts'],
          'icons-vendor':   ['lucide-react'],
        },
      },
    },
  },
})
