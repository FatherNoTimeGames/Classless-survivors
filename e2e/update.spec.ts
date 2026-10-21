import { expect, test } from '@playwright/test';
import { releaseServer } from './pwa-server';
import { SAVE_KEY } from '../src/persistence/profile-store';
import { PRESENTATION_KEY } from '../src/persistence/presentation-store';
import { menuSection } from './game-helpers';

test('recover a cached legacy release with another window open, preserve saves, then reopen offline', async ({ page, context }) => {
  const server = await releaseServer(false, true);
  try {
    await page.goto(server.origin + '/game/');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
    await page.locator('#edit-talents').click();
    await page.getByRole('button', { name: /Inspect Iron Reprisal/ }).click(); await page.locator('#allocate-talent').click();
    await page.locator('#profile-panel > summary').click(); await page.locator('#build-name').fill('Keep my build'); await page.locator('#save-build').click();
    await page.locator('#close-talents').click();
    await menuSection(page, '#presentation-summary'); await page.locator('#sound-muted').check();
    await page.locator('#motion-preference').selectOption('reduced'); await menuSection(page, '#presentation-summary');
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    const preferences = await page.evaluate((key) => localStorage.getItem(key), PRESENTATION_KEY);
    await page.evaluate(async () => {
      for (const key of ['unrelated-app', 'classless-survivors:%2Fother%2F:shell:keep']) await (await caches.open(key)).put('/sentinel', new Response('keep'));
    });
    const other = await context.newPage(); await other.goto(server.origin + '/game/');
    server.update(); await page.reload();
    // Reloading cannot escape the old shell while another client holds it open.
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'legacy');
    await expect(page.locator('#game-version')).toHaveText('Game version 1.0.0');
    const response = await page.goto(server.origin + '/game/update.html');
    expect(response!.fromServiceWorker()).toBe(false);
    await page.locator('#refresh-game').click();
    await page.waitForURL(server.origin + '/game/');
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'two');
    await expect(page.locator('#game-version')).toHaveText('Game version 1.1.1');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    expect(await page.evaluate((key) => localStorage.getItem(key), PRESENTATION_KEY)).toBe(preferences);
    await expect(other.locator('meta[name="test-release"]')).toHaveAttribute('content', 'legacy');
    const keys = await page.evaluate(() => caches.keys()); expect(keys).toContain('unrelated-app'); expect(keys).toContain('classless-survivors:%2Fother%2F:shell:keep');
    await context.setOffline(true); await page.reload();
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'two');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
    await expect(page.locator('#edit-talents')).toHaveText('Talents (1/8)');
    await page.locator('#start-run').click(); await expect(page.locator('#pause-run')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  } finally { await context.close(); await server.close(); }
});

test('an offline recovery attempt preserves the old shell and can retry when connected', async ({ page, context }) => {
  const server = await releaseServer(false, true);
  try {
    await page.goto(server.origin + '/game/'); await expect(page.locator('#offline-status')).toContainText('Offline ready');
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    const keys = await page.evaluate(() => caches.keys());
    server.update(); await page.goto(server.origin + '/game/update.html');
    await context.setOffline(true); await page.locator('#refresh-game').click();
    await expect(page.locator('#update-status')).toContainText('Reconnect and try again');
    await expect(page.locator('#refresh-game')).toBeEnabled();
    expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active))).toBe(true);
    expect(await page.evaluate(() => caches.keys())).toEqual(keys);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await page.getByRole('link', { name: 'Return to the game' }).click();
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'legacy');
    await context.setOffline(false); await page.goto(server.origin + '/game/update.html'); await page.locator('#refresh-game').click();
    await page.waitForURL(server.origin + '/game/'); await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'two');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
  } finally { await context.close(); await server.close(); }
});

test('an incomplete new release cannot replace the good offline shell during recovery', async ({ page, context }) => {
  const server = await releaseServer(false, true);
  try {
    await page.goto(server.origin + '/game/'); await expect(page.locator('#offline-status')).toContainText('Offline ready');
    server.update(true); await page.goto(server.origin + '/game/update.html'); await page.locator('#refresh-game').click();
    await expect(page.locator('#update-status')).toContainText('Reconnect and try again', { timeout: 20_000 });
    expect(server.failed()).toBeGreaterThan(0);
    await context.setOffline(true); await page.getByRole('link', { name: 'Return to the game' }).click();
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'legacy');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
    await context.setOffline(false); server.repair(); await page.goto(server.origin + '/game/update.html'); await page.locator('#refresh-game').click();
    await page.waitForURL(server.origin + '/game/'); await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', 'two');
    await expect(page.locator('#offline-status')).toContainText('Offline ready');
  } finally { await context.close(); await server.close(); }
});
