/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' rather than 'autoUpdate': a fully client-side image tool may
      // have unsaved work in memory, so we don't want to silently swap the
      // app shell out from under an active session.
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Tessellate — Dynamic Image Grid',
        short_name: 'Tessellate',
        description:
          'A fast, private, client-side tool to arrange batches of images into justified, fixed-scale, or masonry grids.',
        start_url: '/',
        display: 'standalone',
        background_color: '#141517',
        theme_color: '#141517',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Precache the build output (JS/CSS/HTML) so the shell works offline;
        // images themselves are never cached (they're user data, not assets).
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
  // Bind to 0.0.0.0 so the dev/preview server is reachable across the LAN
  // (e.g. phones/tablets on 192.168.0.x) for real-device testing.
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
