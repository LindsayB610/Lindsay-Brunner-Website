import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  build: {
    emptyOutDir: true,
    manifest: true,
    outDir: "assets/react",
    rollupOptions: {
      input: {
        homepage: "src/react/homepage.tsx",
        about: "src/react/about.tsx",
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
