import { defineConfig } from 'vite';
import { offlineBuild } from './build/pwa.ts';

export default defineConfig({
  // Relative assets also allow deployment beneath a static host's subdirectory.
  base: './',
  plugins: [offlineBuild()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2022' },
});
