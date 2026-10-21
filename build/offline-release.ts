import { createHash } from 'node:crypto';
import { workerSource } from './worker-source.ts';
import type { OfflineAsset } from './worker-source.ts';

/** Deterministic release identity includes every file digest and the worker runtime. */
export function releaseWorker(files: ReadonlyMap<string, string | Uint8Array>): string {
  if (!files.has('index.html')) throw new Error('Offline build requires the emitted index.html');
  // Recovery must always reach the host, including through an older controller.
  const assets: OfflineAsset[] = [...files].filter(([path]) => path !== 'update.html').sort(([a], [b]) => a.localeCompare(b)).map(([path, bytes]) => ({
    path, integrity: `sha256-${createHash('sha256').update(bytes).digest('base64')}`,
  }));
  const revision = createHash('sha256').update(workerSource('BUILD', assets)).digest('hex').slice(0, 20);
  return workerSource(revision, assets);
}
