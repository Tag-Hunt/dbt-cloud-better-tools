import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(process.cwd(), "media/lineage-demo"),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(process.cwd(), "webview/index.html"),
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "app.css" : "assets/[name].[ext]",
      },
    },
  },
});
