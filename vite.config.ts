import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt',
    injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
    manifest: {
      id: '/', name: 'Snap Eat', short_name: 'Snap Eat',
      description: 'Snap Eat — Track your meals, movement and progress. Eat with intention.',
      theme_color: '#10b981', background_color: '#111827', display: 'standalone',
      start_url: '/splash', scope: '/', orientation: 'portrait-primary',
      icons: [{ src: '/icons/snap-eat.png', sizes: '1254x1254', type: 'image/png', purpose: 'any maskable' }],
      shortcuts: [{ name: 'Log a meal', url: '/log-food', icons: [{ src: '/icons/snap-eat.png', sizes: '1254x1254' }] }, { name: 'My progress', url: '/measurements' }],
    },
  })],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
