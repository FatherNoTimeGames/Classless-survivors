/** Separate online entry point: an old shell cannot cache this page's navigation. */
export {};

function verifyWorker(worker: ServiceWorker, revision: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const done = (ok: boolean) => { clearTimeout(timer); channel.port1.close(); if (ok) resolve(); else reject(new Error('Incomplete update')); };
    const timer = setTimeout(() => done(false), 15_000);
    channel.port1.onmessage = (event) => done(event.data?.type === 'OFFLINE_STATUS' && event.data.ready === true && event.data.revision === revision);
    try { worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]); } catch { done(false); }
  });
}

function workerReady(worker: ServiceWorker, container?: ServiceWorkerContainer): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (error?: Error) => {
      clearTimeout(timer); worker.removeEventListener('statechange', check);
      container?.removeEventListener('controllerchange', check);
      if (error) reject(error); else resolve();
    };
    const check = () => {
      if (worker.state === 'redundant') done(new Error('Update installation failed'));
      else if (container ? worker.state === 'activated' && container.controller === worker
        : worker.state === 'installed' || worker.state === 'activated') done();
    };
    const timer = setTimeout(() => done(new Error('Update timed out')), 30_000);
    worker.addEventListener('statechange', check); container?.addEventListener('controllerchange', check); check();
  });
}
const button = document.querySelector<HTMLButtonElement>('#refresh-game')!;
const status = document.querySelector<HTMLElement>('#update-status')!;
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Checking the latest game…';
  const root = new URL('./', location.href);
  try {
    // A non-navigation request with a unique query bypasses the legacy worker's
    // exact asset URLs. Verify connectivity before changing its registration.
    const latest = new URL('index.html', root);
    latest.searchParams.set('refresh', crypto.randomUUID());
    const response = await fetch(latest, { cache: 'reload', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('Game download unavailable');
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    if (!html.querySelector('#arena') || !html.querySelector('meta[name="application-version"]')) throw new Error('Game release unavailable');
    if ('serviceWorker' in navigator) {
      const script = new URL('sw.js', root); script.search = latest.search;
      const source = await fetch(script, { cache: 'reload', signal: AbortSignal.timeout(15_000) });
      if (!source.ok) throw new Error('Update unavailable');
      const revision = /const REVISION = "([a-f0-9]{20})";/.exec(await source.text())?.[1];
      if (!revision) throw new Error('Unknown release');
      status.textContent = 'Saving and verifying the complete update…';
      const container = navigator.serviceWorker;
      const registration = await container.register(new URL('sw.js', root), { scope: root.href, updateViaCache: 'none' });
      await registration.update();
      if (registration.installing) await workerReady(registration.installing);
      const worker = registration.waiting ?? registration.active;
      if (!worker) throw new Error('Update unavailable');
      await verifyWorker(worker, revision);
      // Explicit recovery may activate the verified replacement. Other windows
      // retain their loaded code; no client is reloaded except this page.
      const activated = workerReady(worker, container);
      if (registration.waiting) worker.postMessage({ type: 'APPLY_UPDATE' });
      await activated;
    }
    status.textContent = 'Opening the updated game…';
    location.replace(root.href);
  } catch {
    status.textContent = 'Could not reach the latest game. Reconnect and try again. Your saved progress and offline files have been kept.';
    button.disabled = false;
  }
});
