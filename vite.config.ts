import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/storealfabet/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["ikon-192.png", "ikon-512.png", "apple-touch-icon.png"],
      manifest: {
        name: "StoreAlfabet",
        short_name: "StoreAlfabet",
        description: "Alf har forsovet seg. Hjelp ham til skolen med bokstaver!",
        lang: "nb",
        start_url: "/storealfabet/",
        scope: "/storealfabet/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1b1633",
        theme_color: "#3d2a6e",
        icons: [
          { src: "ikon-192.png", sizes: "192x192", type: "image/png" },
          { src: "ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "ikon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
