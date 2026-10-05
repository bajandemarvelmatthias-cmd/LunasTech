import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // Guide content opened once stays readable offline (decision-log.md #12).
        // Network first: fresh content when online, the saved copy when not.
        // Only the four read-only content tables are cached. Progress, profile
        // and simulation requests are never stored.
        runtimeCaching: [
          {
            // Runs inside the service worker: it is copied as text, so it must
            // not use anything defined outside it. Keep the table names in
            // step with features/guides/api.ts.
            urlPattern: ({ url }) =>
              /^\/rest\/v1\/(device_types|symptoms|guides|guide_steps)$/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "guide-content",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
      manifest: {
        name: "LunasTech",
        short_name: "LunasTech",
        display: "standalone",
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        // PLACEHOLDER icons (flat green square, white L). Replace the three
        // files in public/ with the real icon (open-questions.md #3).
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
