import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    reportCompressedSize: true,
  },
});
