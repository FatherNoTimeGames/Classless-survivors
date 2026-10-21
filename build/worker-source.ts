export interface OfflineAsset { path: string; integrity: string }

/** Classic worker source: independent of the DOM, game simulation and save storage. */
export function workerSource(revision: string, assets: readonly OfflineAsset[]): string {
  return `/* Classless Survivors: generated, integrity-checked offline shell. */
const REVISION = ${JSON.stringify(revision)};
const ROOT = new URL('./', self.location.href);
const PREFIX = 'classless-survivors:' + encodeURIComponent(ROOT.pathname) + ':shell:';
const CACHE = PREFIX + REVISION;
const ASSETS = ${JSON.stringify(assets)}.map(asset => ({ ...asset, url: new URL(asset.path, ROOT).href }));
const URLS = new Set(ASSETS.map(asset => asset.url));
const INDEX = new URL('index.html', ROOT).href;

async function complete() {
  const cache = await caches.open(CACHE);
  return (await Promise.all(ASSETS.map(asset => cache.match(asset.url, { ignoreVary: true })))).every(response => response && response.ok);
}
async function download() {
  const cache = await caches.open(CACHE);
  // addAll is atomic. Integrity also covers HTML/manifest/icons, preventing a
  // mixed deployment from becoming the offline shell or overwriting a good copy.
  await cache.addAll(ASSETS.map(asset => new Request(asset.url, {
    cache: 'reload', credentials: 'same-origin', integrity: asset.integrity,
  })));
}
self.addEventListener('install', event => {
  // Normal updates wait. Only the separate recovery page can request activation.
  event.waitUntil(download().catch(async error => { await caches.delete(CACHE); throw error; }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('range') || url.origin !== ROOT.origin) return;
  const home = request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === new URL(INDEX).pathname);
  if (!home && !URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Hosts may add Vary: Origin/Accept-Encoding. These exact build files were
    // integrity-checked, so module/CSS request headers must not hide their copy.
    return await cache.match(home ? INDEX : request, { ignoreVary: true }) || fetch(request);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') {
    const source = event.source && new URL(event.source.url);
    if (source && source.origin === ROOT.origin && source.pathname === new URL('update.html', ROOT).pathname) {
      event.waitUntil((async () => { if (await complete()) await self.skipWaiting(); })());
    }
    return;
  }
  if (!['CHECK_OFFLINE', 'CACHE_GAME'].includes(event.data?.type) || !event.ports[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    let failed = false;
    try { if (event.data.type === 'CACHE_GAME') await download(); }
    catch { failed = true; }
    let ready = false;
    try { ready = await complete(); } catch { failed = true; }
    port.postMessage({ type: 'OFFLINE_STATUS', revision: REVISION, ready, failed });
  })());
});
`;
}
