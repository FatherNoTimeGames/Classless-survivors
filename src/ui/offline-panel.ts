import { createOfflineClient } from '../offline/client';
import { element } from './dom';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Installation affordance and offline status; registration lives outside the UI. */
export function createOfflinePanel(production: boolean, onOpen: () => void) {
  const root = element<HTMLDetailsElement>('#offline-settings');
  const cache = element<HTMLButtonElement>('#cache-game'), update = element<HTMLButtonElement>('#check-updates');
  const install = element<HTMLButtonElement>('#install-game'), help = element('#install-help');
  const events = new AbortController(), options = { signal: events.signal };
  const standalone = matchMedia('(display-mode: standalone)');
  let prompt: InstallPrompt | null = null, installed = standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const client = createOfflineClient(production);
  function installView(): void {
    install.hidden = !prompt || installed;
    help.textContent = installed ? 'App installed. Offline readiness is shown above.'
      : 'On Android Chrome, use Install game when offered, or the browser menu → Install app / Add to Home screen. On iPhone/iPad Safari, use Share → Add to Home Screen. Installation is optional.';
  }
  client.subscribe((state) => {
    element('#offline-status').textContent = !state.supported ? state.notice : state.busy
      ? 'Saving the complete game for offline play…' : state.ready
        ? `Offline ready. This version is saved on this device.${navigator.onLine ? '' : ' You are offline.'}`
        : 'Offline copy is not ready. Keep this page open while connected, or retry below.';
    element('#offline-notice').textContent = state.waiting
      ? 'An update is ready. Finish your runs, close all game tabs and installed windows, then reopen. Active runs keep their current version.'
      : state.supported ? state.notice : '';
    cache.disabled = update.disabled = !state.supported || state.busy;
  });
  root.addEventListener('toggle', () => { if (root.open) onOpen(); }, options);
  cache.addEventListener('click', () => { void client.cache(); }, options);
  update.addEventListener('click', () => { void client.update(); }, options);
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); prompt = event as InstallPrompt; installView(); }, options);
  window.addEventListener('appinstalled', () => { installed = true; prompt = null; installView(); }, options);
  standalone.addEventListener('change', () => { installed = standalone.matches; installView(); }, options);
  install.addEventListener('click', async () => {
    const offer = prompt; if (!offer) return;
    prompt = null; installView();
    try { await offer.prompt(); await offer.userChoice; } catch { /* Browser menu installation remains available. */ }
  }, options);
  installView(); void client.start();
  return { destroy(): void { events.abort(); client.destroy(); } };
}
