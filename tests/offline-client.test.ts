import { afterEach, expect, it, vi } from 'vitest';
import { createOfflineClient } from '../src/offline/client';
import type { OfflineState } from '../src/offline/client';

// Explicit browser-API fixture to force event ordering; native worker tests remain separate.
class Channel {
  port1 = { onmessage: null as ((event: { data: unknown }) => void) | null, close() {} };
  port2 = { postMessage: (data: unknown) => queueMicrotask(() => this.port1.onmessage?.({ data })) };
}
class Worker extends EventTarget {
  state: ServiceWorkerState = 'activated';
  postMessage(_message: unknown, ports: MessagePort[]) {
    ports[0]!.postMessage({ type: 'OFFLINE_STATUS', ready: true, failed: false });
  }
}
class Registration extends EventTarget {
  active: Worker | null = new Worker();
  installing: Worker | null = null;
  waiting: Worker | null = null;
  fail = true;
  async update() {
    const worker = new Worker(); worker.state = 'installing'; this.installing = worker;
    this.dispatchEvent(new Event('updatefound'));
    // Fail before the old active worker answers CHECK_OFFLINE.
    queueMicrotask(() => {
      worker.state = this.fail ? 'redundant' : 'installed';
      this.waiting = this.fail ? null : worker; this.installing = null;
      worker.dispatchEvent(new Event('statechange'));
    });
  }
}
function browser(registration: Registration) {
  const container = Object.assign(new EventTarget(), { register: vi.fn(async () => registration) });
  vi.stubGlobal('window', Object.assign(new EventTarget(), { caches: {}, setTimeout }));
  vi.stubGlobal('navigator', { serviceWorker: container });
  vi.stubGlobal('document', { baseURI: 'https://game.test/' });
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('MessageChannel', Channel);
  return container;
}
afterEach(() => vi.unstubAllGlobals());

it('retains a failed-update notice when the old active copy verifies, and clears it on a successful retry', async () => {
  const registration = new Registration(); browser(registration);
  const client = createOfflineClient(true);
  let state: OfflineState | undefined; client.subscribe((value) => { state = value; });
  try {
    await client.start(); expect(state?.ready).toBe(true);
    await client.update();
    expect(state?.ready).toBe(true); expect(state?.waiting).toBe(false);
    expect(state?.notice).toContain('download failed');
    registration.fail = false; await client.update();
    expect(state?.notice).toBe(''); expect(state?.waiting).toBe(true);
  } finally { client.destroy(); }
});

it('re-registers when retrying an initial download that left no active worker', async () => {
  const failed = new Registration(); failed.active = null;
  const container = browser(failed), good = new Registration();
  container.register.mockResolvedValueOnce(failed).mockResolvedValue(good);
  const client = createOfflineClient(true);
  let state: OfflineState | undefined; client.subscribe((value) => { state = value; });
  try {
    await client.start(); expect(state?.ready).toBe(false);
    await client.cache();
    expect(container.register).toHaveBeenCalledTimes(2); expect(state?.ready).toBe(true);
  } finally { client.destroy(); }
});
