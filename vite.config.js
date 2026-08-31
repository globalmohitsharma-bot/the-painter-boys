import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    // The ASP.NET Core backend lives in backend/ within this same repo —
    // its build output (bin/obj) churns constantly during `dotnet build`
    // and has crashed Vite's watcher with EBUSY on Windows before. Same
    // failure mode from assets/ — a scratch folder for raw source images
    // (logo drafts etc.) that briefly get Windows file-locked on copy.
    watch: { ignored: ['**/backend/**', '**/assets/**'] },
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
        // Real PNG sizes, not just the SVG — Android's install/"Add to Home
        // Screen" prompt and app-switcher icon aren't reliably SVG-friendly
        // across launchers the way an in-page <img> is. The maskable one has
        // the mark scaled to ~65% of the canvas on a white backing (see
        // public/icon-maskable-512.png's generation) so circular/rounded/
        // squircle launcher masks never crop into the artwork.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // A newly-installed service worker used to sit "waiting" until every
        // open tab/PWA instance was fully closed and relaunched before it took
        // over — on a phone that keeps the app backgrounded for days, that
        // looked like "changes don't show up until I clear cache and storage."
        // These two force the new worker to activate and take control of any
        // already-open page immediately after install.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
