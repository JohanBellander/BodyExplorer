import { defineConfig } from 'vite';

// Served from the site root by default (local dev and self-hosting).
// Set BASE_PATH to deploy under a sub-path, e.g. BASE_PATH=/BodyExplorer/ for GitHub Pages.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  server: {
    port: 4000,
    open: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
