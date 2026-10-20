export interface OfflineState { supported: boolean; ready: boolean; waiting: boolean; busy: boolean; notice: string }
interface WorkerStatus { type: 'OFFLINE_STATUS'; ready: boolean; failed: boolean }

/** Registration/cache lifecycle only. Never reloads a client or activates a waiting worker. */
export function createOfflineClient(production: boolean) {
  let container: ServiceWorkerContainer | null = null;
  try { if (production && isSecureContext && window.caches) container = navigator.serviceWorker ?? null; }
  catch { /* Privacy settings can deny even access to these browser APIs. */ }
  const supported = container !== null;
  let state: OfflineState = { supported, ready: false, waiting: false, busy: false, notice: production ? 'Preparing offline play…' : 'Offline installation is available in production builds.' };
  if (production && !supported) state.notice = 'Offline storage is unavailable here. Browser play still works; use HTTPS for installation.';
  let registration: ServiceWorkerRegistration | null = null, destroyed = false, listener = (_state: OfflineState) => {};
  let failedDownload = false;
  const events = new AbortController(), watched = new WeakSet<ServiceWorker>();
  const pending = new Set<() => void>();
  const notify = () => { if (!destroyed) { state.waiting = Boolean(registration?.waiting); listener({ ...state }); } };
  function request(worker: ServiceWorker, type: string): Promise<WorkerStatus | null> {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const finish = (value: WorkerStatus | null) => { clearTimeout(timer); channel.port1.close(); pending.delete(cancel); resolve(value); };
      const cancel = () => finish(null);
      const timer = window.setTimeout(cancel, 15_000); pending.add(cancel);
      channel.port1.onmessage = (event: MessageEvent<WorkerStatus>) => {
        if (event.data?.type === 'OFFLINE_STATUS' && typeof event.data.ready === 'boolean') finish(event.data);
      };
      try { worker.postMessage({ type }, [channel.port2]); } catch { finish(null); }
    });
  }
  async function inspect(type = 'CHECK_OFFLINE'): Promise<void> {
    const worker = registration?.active;
    if (!worker) { notify(); return; }
    const result = await request(worker, type);
    if (destroyed) return;
    state.ready = result?.ready === true;
    // Verification of the old active shell must not erase a failed new download.
    if (!failedDownload) {
      if (result?.failed) state.notice = 'Download could not finish. Reconnect and retry; a newer version may need all game windows closed.';
      else if (!result) state.notice = 'Offline copy could not be verified. Retry while connected.';
      else state.notice = '';
    }
    notify();
  }
  function watch(worker: ServiceWorker | null): void {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant') { failedDownload = true; state.busy = false; state.notice = 'Offline download failed. Keep playing and retry while connected.'; notify(); }
      else if (worker.state === 'activated' || worker.state === 'installed') { failedDownload = false; state.busy = false; notify(); void inspect(); }
    }, { signal: events.signal });
  }
  async function register(): Promise<void> {
    if (!supported || destroyed) return;
    failedDownload = false;
    state.busy = true; notify();
    try {
      const root = new URL('./', document.baseURI);
      registration = await container!.register(new URL('sw.js', root), { scope: root.href, updateViaCache: 'none' });
      if (destroyed) return;
      registration.addEventListener('updatefound', () => { watch(registration!.installing); notify(); }, { signal: events.signal });
      watch(registration.installing);
      if (registration.active) { state.busy = false; await inspect(); }
      else if (!registration.installing) { state.busy = false; state.notice = 'Offline setup did not finish. Retry while connected.'; }
    } catch { state.busy = false; state.notice = 'Offline setup could not start. Browser play still works. Retry while connected.'; }
    notify();
  }
  if (container) {
    container.addEventListener('controllerchange', () => { void inspect(); }, { signal: events.signal });
    for (const name of ['online', 'offline']) window.addEventListener(name, () => { void inspect(); notify(); }, { signal: events.signal });
  }
  return {
    subscribe(callback: (value: OfflineState) => void): void { listener = callback; notify(); },
    start: register,
    async cache(): Promise<void> {
      if (!registration?.active) { await register(); return; }
      state.busy = true; notify(); await inspect('CACHE_GAME'); state.busy = false; notify();
    },
    async update(): Promise<void> {
      if (!registration?.active) { await register(); return; }
      failedDownload = false; state.notice = '';
      state.busy = true; notify();
      try { await registration.update(); await inspect(); }
      catch { state.notice = 'Update check failed. Reconnect to check again; the saved version is unchanged.'; }
      state.busy = false; notify();
    },
    destroy(): void { destroyed = true; events.abort(); for (const cancel of pending) cancel(); },
  };
}
