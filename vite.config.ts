import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets also allow deployment beneath a static host's subdirectory.
  base: './',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2022' },
});
