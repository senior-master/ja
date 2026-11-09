import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'CBT Master - JAMB Practice',
        short_name: 'CBT Master',
        description: 'Practice JAMB UTME questions and master your exams.',
        theme_color: '#09090b', // Updated to Bybit DNA
        background_color: '#09090b', // Updated to Bybit DNA
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/', // Changed for Cloudflare
        scope: '/',     // Changed for Cloudflare
        icons: [
          {
            src: '/icon-192x192.png', // Changed path
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png', // Changed path
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/', // Changed to root for Cloudflare Pages
})
