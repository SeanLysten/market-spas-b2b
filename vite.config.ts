import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Recharts + D3 ecosystem (~300 kB) — used by AdminLeads, AdminGoogleAnalytics, AdminShopify
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) {
            return 'vendor-recharts';
          }
          // react-pdf + pdfjs (~400 kB) — used by PDFViewer
          if (id.includes('node_modules/react-pdf') || id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }
          // Leaflet maps (~200 kB) — used by AdminPartnerMap
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-maps';
          }
          // html2canvas (~200 kB) — used for PDF/image export
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas';
          }
          // socket.io-client (~50 kB) — used by WebSocket hook, AdminLeads, AdminPartnerMap
          if (id.includes('node_modules/socket.io') || id.includes('node_modules/engine.io')) {
            return 'vendor-socketio';
          }
          // date-fns (~80 kB) — shared across many components
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-datefns';
          }
          // Radix UI primitives — shared across all pages
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // lucide-react icons (~100 kB) — shared across all pages
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
