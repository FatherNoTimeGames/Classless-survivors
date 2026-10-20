import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { releaseWorker } from './offline-release.ts';

/** Include actual emitted assets and local public files; no hand-maintained bundle names. */
export function offlineBuild(): Plugin {
  let publicDir = '';
  return {
    name: 'classless-offline-shell', apply: 'build', enforce: 'post',
    configResolved(config) { publicDir = config.publicDir; },
    generateBundle(_options, bundle) {
      const files = new Map<string, string | Uint8Array>();
      for (const [path, entry] of Object.entries(bundle)) files.set(path, entry.type === 'chunk' ? entry.code : entry.source);
      if (!files.has('index.html')) throw new Error('Offline build requires the emitted index.html');
      function include(directory: string): void {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name);
          if (entry.isDirectory()) include(path);
          else if (entry.isFile()) files.set(relative(publicDir, path).replaceAll('\\', '/'), readFileSync(path));
        }
      }
      include(publicDir);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: releaseWorker(files) });
    },
  };
}
