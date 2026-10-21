import { defineConfig } from 'vite';
import { offlineBuild } from './build/pwa.ts';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  // Relative assets also allow deployment beneath a static host's subdirectory.
  base: './',
  plugins: [{ name: 'game-version', transformIndexHtml: (html) => html.replaceAll('__GAME_VERSION__', version) }, offlineBuild()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2022', rolldownOptions: { input: { game: 'index.html', update: 'update.html' } } },
});
