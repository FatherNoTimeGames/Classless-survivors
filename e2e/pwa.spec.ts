import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectUntilChoice, playerPosition } from './game-helpers';
import { SAVE_KEY } from '../src/persistence/profile-store';
import { PRESENTATION_KEY } from '../src/persistence/presentation-store';
import { releaseServer } from './pwa-server';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('#offline-status')).toContainText('Offline ready');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}
async function build(page: Page): Promise<void> {
  await page.locator('#edit-talents').click();
  await page.getByRole('button', { name: /Inspect Iron Reprisal/ }).click(); await page.locator('#allocate-talent').click();
  await page.getByRole('tab', { name: /Mage/ }).click(); await page.getByRole('button', { name: /Inspect Arcane Echo/ }).click(); await page.locator('#allocate-talent').click();
  await page.locator('#profile-panel > summary').click(); await page.locator('#build-name').fill('Offline hybrid'); await page.locator('#save-build').click();
  await page.locator('#close-talents').click();
  await page.locator('#presentation-summary').click(); await page.locator('#sound-muted').check(); await page.locator('#motion-preference').selectOption('reduced'); await page.locator('#presentation-summary').click();
}

test('manifest/icons and offline progress survive a real browser restart, then move, fight, level and choose offline', async ({}, testInfo) => {
  test.setTimeout(90_000);
  const directory = mkdtempSync(join(tmpdir(), 'classless-pwa-'));
  let context: BrowserContext | undefined;
  const launch = () => chromium.launchPersistentContext(directory, {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true,
    viewport: testInfo.project.use.viewport, hasTouch: testInfo.project.use.hasTouch,
    isMobile: testInfo.project.use.isMobile, deviceScaleFactor: testInfo.project.use.deviceScaleFactor,
  });
  try {
    context = await launch(); let page = context.pages()[0]!;
    await page.goto('http://127.0.0.1:4173/'); await ready(page); await build(page);
    const session = await context.newCDPSession(page);
    const manifest = await session.send('Page.getAppManifest'); expect(manifest.errors).toEqual([]);
    const parsed = JSON.parse(manifest.data!); expect(parsed.display).toBe('standalone'); expect(parsed.start_url).toBe('./');
    for (const icon of parsed.icons as { src: string; sizes: string }[]) {
      expect(await page.evaluate(async (src) => { const image = new Image(); image.src = src; await image.decode(); return `${image.naturalWidth}x${image.naturalHeight}`; }, icon.src)).toBe(icon.sizes);
    }
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    // Deliberate cache-eviction fixture; repair via the real worker.
    await page.evaluate(async () => {
      const name = (await caches.keys()).find((key) => key.startsWith('classless-survivors:'))!;
      await (await caches.open(name)).delete(new URL('manifest.webmanifest', location.href).href);
    });
    await page.locator('#offline-settings summary').click(); await page.locator('#cache-game').click();
    await expect(page.locator('#cache-game')).toBeEnabled(); await ready(page);
    expect(await page.evaluate(async () => {
      const name = (await caches.keys()).find((key) => key.startsWith('classless-survivors:'))!;
      return Boolean(await (await caches.open(name)).match(new URL('manifest.webmanifest', location.href).href));
    })).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await context.close(); context = undefined;
    context = await launch(); await context.setOffline(true); page = context.pages()[0]!;
    await page.clock.install(); await page.clock.pauseAt(new Date());
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    const sources: { url: string; cached: boolean }[] = [];
    page.on('response', (response) => { if (/\.(js|css)$/.test(response.url())) sources.push({ url: response.url(), cached: response.fromServiceWorker() }); });
    const response = await page.goto('http://127.0.0.1:4173/?source=installed'); await ready(page);
    expect(response!.fromServiceWorker()).toBe(true);
    expect(sources.some((source) => source.url.endsWith('.js'))).toBe(true); expect(sources.some((source) => source.url.endsWith('.css'))).toBe(true);
    expect(sources.every((source) => source.cached)).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await expect(page.locator('#edit-talents')).toHaveText('Talents (2/8)');
    await expect(page.locator('body')).toHaveAttribute('data-reduced-motion', 'true');
    const settings = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PRESENTATION_KEY); expect(settings.muted).toBe(true);
    await page.locator('#start-run').click(); const canvas = page.locator('#arena');
    const before = await playerPosition(canvas); await page.keyboard.down('KeyD'); await page.clock.runFor(300); await page.keyboard.up('KeyD');
    expect((await playerPosition(canvas)).x).toBeGreaterThan(before.x + 20);
    await page.clock.runFor(12_000); await collectUntilChoice(page, canvas);
    await page.locator('#upgrade-choices button').first().click();
    await expect(page.locator('#run-level')).toHaveText('2'); expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  } finally { await context?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('a new release waits for all game clients, then activates offline without deleting profiles, settings or other caches', async ({ context }) => {
  test.setTimeout(60_000); const server = await releaseServer();
  try {
    const observer = await context.newPage(); await observer.goto(server.origin + '/observer.html');
    const first = await context.newPage(); await first.clock.install(); await first.clock.pauseAt(new Date());
    await first.goto(server.origin + '/game/'); await ready(first); await build(first);
    const settings = await first.evaluate((key) => localStorage.getItem(key), PRESENTATION_KEY);
    const profile = await first.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
    await first.evaluate(async () => { for (const name of ['unrelated-app', 'classless-survivors:%2Fother%2F:shell:keep']) { const cache = await caches.open(name); await cache.put('/sentinel', new Response('keep')); } });
    const old = await first.evaluate(async () => (await caches.keys()).find((key) => key.startsWith('classless-survivors:%2Fgame%2F:shell:'))!);
    await first.locator('#start-run').click(); await first.clock.runFor(500);
    const second = await context.newPage(); await second.goto(server.origin + '/game/'); await ready(second);
    server.update(); await second.locator('#offline-settings summary').click(); await second.locator('#check-updates').click();
    await expect(second.locator('#offline-notice')).toContainText('An update is ready');
    expect(await first.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.waiting!.state)).toBe('installed');
    await expect(first.locator('#run-overlay')).toBeHidden();
    await first.clock.runFor(1100); await expect(first.locator('#run-time')).not.toHaveText('00:00');
    await second.reload(); await expect(second.locator('meta[name="test-release"]')).toHaveCount(0);
    expect(await second.evaluate(async () => (await caches.keys()).includes('unrelated-app'))).toBe(true);
    await first.close(); await second.close();
    await expect.poll(() => observer.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/game/');
      return registration?.active?.state === 'activated' && !registration.waiting;
    })).toBe(true);
    await expect.poll(() => observer.evaluate(async (key) => !(await caches.keys()).includes(key), old)).toBe(true);
    await context.setOffline(true); const reopened = await context.newPage(); await reopened.goto(server.origin + '/game/'); await ready(reopened);
    await expect(reopened.locator('meta[name="test-release"]')).toHaveAttribute('content', 'two');
    const after = await reopened.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
    expect(after.draft).toEqual(profile.draft); expect(after.slots).toEqual(profile.slots); expect(after.completedRuns).toBe(profile.completedRuns);
    expect(await reopened.evaluate((key) => localStorage.getItem(key), PRESENTATION_KEY)).toBe(settings);
    const keys = await reopened.evaluate(() => caches.keys()); expect(keys).toContain('unrelated-app'); expect(keys).toContain('classless-survivors:%2Fother%2F:shell:keep'); expect(keys).not.toContain(old);
  } finally { await context.close(); await server.close(); }
});

test('failed update download keeps the current shell playable offline and retries successfully online', async ({ page, context }) => {
  test.setTimeout(60_000); const server = await releaseServer();
  try {
    await page.goto(server.origin + '/game/'); await ready(page);
    const original = await page.evaluate(() => caches.keys());
    server.update(true); await page.locator('#offline-settings summary').click(); await page.locator('#check-updates').click();
    await expect(page.locator('#offline-notice')).toContainText('download failed');
    expect(server.failed()).toBeGreaterThan(0); expect(await page.evaluate(() => caches.keys())).toEqual(original);
    await context.setOffline(true); await page.reload(); await ready(page); await expect(page.locator('meta[name="test-release"]')).toHaveCount(0);
    await page.locator('#start-run').click(); await expect(page.locator('#pause-run')).toBeVisible(); await page.locator('#pause-run').click();
    await context.setOffline(false); server.update(); await page.locator('#offline-settings summary').click(); await page.locator('#check-updates').click();
    await expect(page.locator('#offline-notice')).toContainText('An update is ready');
  } finally { await page.close(); await server.close(); }
});

test('unavailable registration leaves gameplay usable; the optional install button follows browser offers', async ({ page }) => {
  await page.addInitScript(() => { ServiceWorkerContainer.prototype.register = () => Promise.reject(new DOMException('Blocked', 'SecurityError')); });
  await page.clock.install(); await page.clock.pauseAt(new Date()); await page.goto('/');
  await expect(page.locator('#offline-notice')).toContainText('could not start');
  await page.locator('#offline-settings summary').click();
  // The OS install UI is unavailable in headless Chromium. Verify only the
  // deferred-offer/gesture boundary with an explicit browser-event fixture.
  await page.evaluate(() => {
    const offer = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(offer, { prompt: async () => { document.body.dataset.installRequested = 'true'; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
    window.dispatchEvent(offer);
  });
  await page.locator('#install-game').click(); await expect(page.locator('body')).toHaveAttribute('data-install-requested', 'true'); await expect(page.locator('#install-game')).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('#install-help')).toContainText('App installed');
  await page.locator('#offline-settings summary').click(); await page.locator('#start-run').click(); await page.clock.runFor(1500);
  await expect(page.locator('#run-time')).not.toHaveText('00:00');
  await page.addInitScript(() => { Object.defineProperty(navigator, 'serviceWorker', { get() { throw new DOMException('Disabled', 'SecurityError'); } }); });
  await page.reload(); await expect(page.locator('#offline-status')).toContainText('unavailable');
  await page.locator('#start-run').click(); await page.clock.runFor(1500); await expect(page.locator('#run-time')).not.toHaveText('00:00');
});
