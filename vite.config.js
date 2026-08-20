import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Visible build marker (see App.jsx's corner badge) — lets anyone confirm
  // which actual build is loaded without opening DevTools, useful whenever
  // stale-cache vs "real bug" needs to be told apart at a glance.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    // The ASP.NET Core backend lives in backend/ within this same repo —
    // its build output (bin/obj) churns constantly during `dotnet build`
    // and has crashed Vite's watcher with EBUSY on Windows before.
    watch: { ignored: ['**/backend/**'] },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'The Painter Boys',
        short_name: 'PainterBoys',
        description: 'Professional Home Painting Services — Ghaziabad, Noida, Delhi NCR',
        theme_color: '#0d2137',
        background_color: '#0d2137',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
