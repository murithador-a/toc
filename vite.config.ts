import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The site and the admin both talk to the Express API on the same origin.
 * In development Vite proxies /api and /uploads to the API process so cookies,
 * CSRF checks and relative URLs behave exactly as they do in production, where
 * server/index.js serves dist/ and the API from one origin.
 */

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiTarget = env.API_PROXY_TARGET || `http://127.0.0.1:${env.API_PORT || 8787}`

  /**
   * Vite only allows CORS from localhost by default, which stops the app booting
   * inside a sandboxed preview frame (its origin is reported as `null`, so every
   * module and font request is refused). The dev and preview servers are only
   * reachable through the preview URL itself, and the API they proxy never sends
   * credentials to another origin, so an open CORS policy here is safe and is
   * what makes the live preview work in an embedded panel.
   */
  const cors = { origin: '*' }

  const proxy = {
    '/api': { target: apiTarget, changeOrigin: false },
    '/uploads': { target: apiTarget, changeOrigin: false },
  }

  return {
  plugins: [react()],
  server: {
    host: true, // bind 0.0.0.0 so preview hosts can reach the dev server
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy,
    cors,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: true,
    proxy,
    cors,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  }
})
