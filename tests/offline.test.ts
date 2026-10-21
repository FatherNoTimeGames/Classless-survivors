import { expect, test, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { releaseWorker } from '../build/offline-release';
import { workerSource } from '../build/worker-source';

function worker(scope = '/game/', revision = 'one') {
  const root = `https://game.test${scope}`, prefix = `classless-survivors:${encodeURIComponent(scope)}:shell:`;
  const storage = new Map<string, Map<string, Response>>();
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  let fail = false;
  const fetch = vi.fn(async () => { if (fail) throw new Error('Offline'); return new Response('network'); });
  const caches = {
    async open(key: string) {
      if (!storage.has(key)) storage.set(key, new Map());
      const entries = storage.get(key)!;
      return {
        async match(request: string | Request) { return entries.get(typeof request === 'string' ? request : request.url)?.clone(); },
        async addAll(requests: Request[]) {
          const results = await Promise.all(requests.map(async (request) => [request.url, await fetch()] as const));
          for (const [url, response] of results) entries.set(url, response);
        },
      };
    },
    async keys() { return [...storage.keys()]; },
    async delete(key: string) { return storage.delete(key); },
  };
  const claim = vi.fn(), skipWaiting = vi.fn();
  runInNewContext(workerSource(revision, [{ path: 'index.html', integrity: 'sha256-index' }, { path: 'assets/game.js', integrity: 'sha256-code' }]), {
    self: { location: { href: `${root}sw.js` }, clients: { claim }, skipWaiting, addEventListener: (name: string, callback: (event: Record<string, unknown>) => void) => handlers.set(name, callback) },
    URL, Request, Response, caches, fetch,
  });
  const event = async (name: string, values = {}) => {
    let work: Promise<unknown> | undefined;
    handlers.get(name)!({ ...values, waitUntil: (value: Promise<unknown>) => { work = value; } });
    await work;
  };
  return { root, prefix, storage, caches, claim, skipWaiting, fetch, event, offline: () => { fail = true; },
    async request(request: Request) {
      let response: Promise<Response> | undefined;
      handlers.get('fetch')!({ request, respondWith: (value: Promise<Response>) => { response = value; } });
      return response ? await (await response).text() : null;
    },
    async message(type: string, source?: string) {
      const reply = vi.fn(); await event('message', { data: { type }, source: source ? { url: source } : undefined, ports: [{ postMessage: reply }] });
      return reply.mock.calls[0]?.[0];
    },
  };
}

test('successful install saves the whole shell and never forces activation, including via messages', async () => {
  const w = worker(); await w.event('install');
  expect([...w.storage.get(w.prefix + 'one')!.keys()]).toEqual([w.root + 'index.html', w.root + 'assets/game.js']);
  expect(await w.message('SKIP_WAITING')).toBeUndefined(); expect(w.skipWaiting).not.toHaveBeenCalled();
  expect(w.claim).not.toHaveBeenCalled();
});
test('a failed install removes its incomplete cache and preserves the previous version', async () => {
  const w = worker(); w.storage.set(w.prefix + 'old', new Map([['save-me', new Response('old')]])); w.offline();
  await expect(w.event('install')).rejects.toThrow('Offline');
  expect(await w.caches.keys()).toEqual([w.prefix + 'old']);
});
test('activation deletes only obsolete caches for this installation scope', async () => {
  const w = worker(); for (const key of [w.prefix + 'old', w.prefix + 'one', 'unrelated-cache', 'classless-survivors:%2Fother%2F:shell:old']) w.storage.set(key, new Map());
  await w.event('activate');
  expect(await w.caches.keys()).toEqual([w.prefix + 'one', 'unrelated-cache', 'classless-survivors:%2Fother%2F:shell:old']);
  expect(w.claim).toHaveBeenCalledOnce();
});
test.each(['/game/', '/game/index.html?source=home'])('offline navigation %s uses the complete cached index', async (path) => {
  const w = worker(); await w.event('install'); w.offline();
  // Node Request cannot construct navigate mode; mirror the native request field.
  const request = new Request(`https://game.test${path}`); Object.defineProperty(request, 'mode', { value: 'navigate' });
  expect(await w.request(request)).toBe('network');
});
test('known assets stay available offline while unknown, cross-origin, range and non-GET requests bypass caching', async () => {
  const w = worker(); await w.event('install'); w.offline();
  expect(await w.request(new Request(w.root + 'assets/game.js'))).toBe('network');
  for (const request of [new Request(w.root + 'api'), new Request(w.root + 'sw.js'), new Request('https://elsewhere.test/'), new Request(w.root + 'assets/game.js', { headers: { Range: 'bytes=0-5' } }), new Request(w.root, { method: 'POST' })]) expect(await w.request(request)).toBeNull();
});
test('missing known cache entries use the network without caching an unverified replacement', async () => {
  const w = worker(); await w.event('install'); w.storage.get(w.prefix + 'one')!.delete(w.root + 'assets/game.js');
  expect(await w.request(new Request(w.root + 'assets/game.js'))).toBe('network');
  expect(w.storage.get(w.prefix + 'one')!.has(w.root + 'assets/game.js')).toBe(false);
});
test('offline readiness requires every asset and repair downloads the complete shell', async () => {
  const w = worker(); expect(await w.message('CHECK_OFFLINE')).toMatchObject({ ready: false });
  expect(await w.message('CACHE_GAME')).toMatchObject({ ready: true, failed: false });
  w.storage.get(w.prefix + 'one')!.delete(w.root + 'assets/game.js');
  expect(await w.message('CHECK_OFFLINE')).toMatchObject({ ready: false });
});
test('a failed repair keeps an existing good offline copy and reports the failure', async () => {
  const w = worker(); await w.event('install'); w.offline();
  expect(await w.message('CACHE_GAME')).toMatchObject({ ready: true, failed: true });
});
test('release identity is stable across file order and changes for HTML, manifest or icon changes', () => {
  const files = new Map([['index.html', '<html>one</html>'], ['manifest.webmanifest', '{}'], ['icons/icon.png', 'icon']]);
  const before = releaseWorker(files);
  expect(releaseWorker(new Map([...files].reverse()))).toBe(before);
  for (const key of files.keys()) { const changed = new Map(files); changed.set(key, 'updated'); expect(releaseWorker(changed)).not.toBe(before); }
  expect(() => releaseWorker(new Map())).toThrow('index.html');
});

test('recovery HTML always bypasses the offline shell so an old installation can reach a fresh update page', () => {
  const source = releaseWorker(new Map([['index.html', '<html></html>'], ['update.html', 'Recovery']]));
  expect(source).not.toContain('"path":"update.html"');
});

test('only an explicit recovery page with a complete verified shell can activate a waiting release', async () => {
  const w = worker();
  await w.message('APPLY_UPDATE', w.root + 'update.html'); expect(w.skipWaiting).not.toHaveBeenCalled();
  await w.event('install');
  for (const source of [undefined, w.root, 'https://elsewhere.test/game/update.html', 'https://game.test/other/update.html']) await w.message('APPLY_UPDATE', source);
  expect(w.skipWaiting).not.toHaveBeenCalled();
  await w.message('APPLY_UPDATE', w.root + 'update.html?version=new'); expect(w.skipWaiting).toHaveBeenCalledOnce();
});
