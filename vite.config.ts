import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig({
  base: "/portfolio/",
  plugins: [
    tailwindcss(),
    react(),
    viteStaticCopy({
      targets: ["cmaps", "standard_fonts", "wasm"].map((directory) => ({
        src: `node_modules/pdfjs-dist/${directory}`,
        dest: "pdfjs",
      })),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
