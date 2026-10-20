import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { releaseWorker } from '../build/offline-release';

/** Two real shell releases on a subdirectory host, using the production emitter. */
export async function releaseServer() {
  const first = new Map<string, Uint8Array>();
  function collect(path: string, relative = ''): void {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = relative + entry.name;
      if (entry.isDirectory()) collect(join(path, entry.name), name + '/');
      else first.set(name, readFileSync(join(path, entry.name)));
    }
  }
  collect('dist');
  const second = new Map(first); second.delete('sw.js');
  second.set('index.html', Buffer.from(Buffer.from(first.get('index.html')!).toString().replace('<head>', '<head><meta name="test-release" content="two" />')));
  second.set('sw.js', Buffer.from(releaseWorker(second)));
  let updated = false, broken = false, failedRequests = 0;
  const missing = [...first.keys()].find((path) => path.endsWith('.css'))!;
  const server = createServer((request, response) => {
    const path = new URL(request.url!, 'http://local.test').pathname;
    response.setHeader('Cache-Control', 'no-store');
    if (path === '/observer.html') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Update observer outside game scope</title>'); return; }
    const name = path === '/game/' ? 'index.html' : path.slice('/game/'.length);
    if (!path.startsWith('/game/')) { response.statusCode = 404; response.end('Missing'); return; }
    // A successful HTTP response with the wrong bytes must also fail installation.
    if (broken && name === missing) { failedRequests++; response.setHeader('Content-Type', 'text/css'); response.end('/* incomplete deployment */'); return; }
    const bytes = (updated ? second : first).get(name);
    if (!bytes) { response.statusCode = 404; response.end('Missing'); return; }
    const type = name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.html') ? 'text/html' : name.endsWith('.png') ? 'image/png' : name.endsWith('.svg') ? 'image/svg+xml' : 'application/manifest+json';
    response.setHeader('Content-Type', type); response.end(bytes);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test server port');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    update(fail = false): void { updated = true; broken = fail; },
    failed: () => failedRequests,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}
