import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { SAVE_KEY, RECOVERY_KEY } from '../src/persistence/profile-store';
import { newProfile, setDraft } from '../src/profile/profile';
import { BOSSES } from '../src/content/bosses';
import { formatTime } from '../src/ui/dom';
import { seedRuns, choosePreferredUpgrade, playerPosition } from './game-helpers';

test('migrate on boot, finish three runs, respec and replay offline without multiplying animation loops', async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await seedRuns(page);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, build: ['reprisal', 'arcane-echo'], completedRuns: 2 }));
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>(), counts = { pending: 0, peak: 0 };
    Object.assign(window, { releaseFrames: counts });
    // Observe browser APIs and accelerate elapsed time; no combat state is exposed or injected.
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => { pending.delete(id); counts.pending = pending.size; callback(time * 12); });
      pending.add(id); counts.pending = pending.size; counts.peak = Math.max(counts.peak, pending.size);
      return id;
    };
    window.cancelAnimationFrame = (id) => { pending.delete(id); counts.pending = pending.size; cancel(id); };
  }, SAVE_KEY);
  await page.goto('/');
  for (const guardian of BOSSES) {
    await expect(page.locator('#overlay-description')).toContainText(formatTime(guardian.at).replace(/^0/, ''));
    await expect(page.locator('#enemy-guide')).toContainText(formatTime(guardian.at).replace(/^0/, ''));
  }
  await expect(page.locator('#offline-status')).toContainText('Offline ready');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  const editor = page.getByRole('dialog', { name: 'Classless talents' });
  await expect(page.locator('#edit-talents')).toHaveText('Talents (2/9)');
  await activate(page.locator('#edit-talents')); await activate(editor.locator('#profile-panel > summary'));
  await expect(editor.locator('#save-status')).toContainText('Updated an early save');
  await editor.locator('#build-name').fill('Migrated Ember'); await activate(editor.locator('#save-build'));
  await activate(editor.locator('#close-talents'));
  await context.setOffline(true);
  for (let cycle = 0; cycle < 3; cycle++) {
    await activate(page.locator('#start-run'));
    await expect(page.locator('#run-time')).toHaveText('00:00');
    await expect(page.locator('#run-level')).toHaveText('1');
    await expect(page.locator('#run-xp')).toHaveText('0');
    await expect(page.locator('#health-text')).toHaveText('60 / 60');
    for (let batch = 0; batch < 100; batch++) {
      while (await page.locator('#upgrade-picker').isVisible()) {
        await choosePreferredUpgrade(page, ['haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst', 'precision', 'venom'], Boolean(testInfo.project.use.hasTouch));
      }
      if (await page.locator('#return-to-build').isVisible()) break;
      await page.clock.runFor(250);
    }
    await expect(page.locator('#overlay-title')).toHaveText('The ember fades');
    await expect(page.locator('#run-reward')).toContainText('insight earned');
    const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
    const profile = JSON.parse(saved); expect(profile.version).toBe(2);
    expect(profile.completedRuns).toBe(cycle + 3); expect(profile.activeRun).toBeNull();
    expect(profile.draft).toEqual(['reprisal', 'arcane-echo']);
    expect(profile.slots[0].name).toBe('Migrated Ember');
    await page.clock.runFor(2000);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    expect(await page.evaluate(() => (window as unknown as { releaseFrames: { pending: number; peak: number } }).releaseFrames)).toEqual({ pending: 0, peak: 1 });
  }
  await page.reload();
  await expect(page.locator('#edit-talents')).toHaveText('Talents (2/10)');
  await activate(page.locator('#edit-talents')); await activate(editor.locator('#respec-talents'));
  for (const [branch, talent] of [['Mage', 'Arcane Echo'], ['Warlock', 'Soul Cinder'], ['Hunter', 'Hunting Momentum']]) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch!) }));
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) })); await activate(editor.locator('#allocate-talent'));
  }
  await activate(editor.locator('#close-talents')); await activate(page.locator('#start-run'));
  const before = await playerPosition(page.locator('#arena'));
  await page.keyboard.down('KeyD'); await page.clock.runFor(32); await page.keyboard.up('KeyD');
  expect((await playerPosition(page.locator('#arena'))).x).toBeGreaterThan(before.x + 10);
  // An unfinished replay is discarded on offline reload without claiming a fourth outcome.
  await page.reload();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.completedRuns).toBe(5); expect(saved.draft).toEqual(['arcane-echo', 'soul-cinder', 'hunting-momentum']);
  await expect(page.locator('#edit-talents')).toHaveText('Talents (3/10)');
  expect(errors).toEqual([]);
});

test('a future-save tab cannot overwrite another tab after reviewing an older backup', async ({ page, context }, testInfo) => {
  const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  const openBackup = async (target: Page, backup: string) => {
    await activate(target.locator('#edit-talents'));
    await activate(target.locator('#profile-panel > summary')); await activate(target.locator('#profile-panel details > summary'));
    await target.locator('#backup-text').fill(backup); await activate(target.locator('#review-backup'));
    await expect(target.locator('#confirm-import')).toBeVisible();
  };
  await page.goto('/');
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ version: 99, marker: 'original' })), SAVE_KEY);
  await page.reload();
  await openBackup(page, JSON.stringify(setDraft(newProfile(), ['arcane-echo'])));
  const other = await context.newPage(); await other.goto('/');
  await openBackup(other, JSON.stringify(setDraft(newProfile(), ['reprisal'])));
  await activate(other.locator('#confirm-import'));
  await expect(other.locator('#talent-points')).toContainText('1 / 8');
  const durable = await other.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  await activate(page.locator('#confirm-import'));
  await expect(page.locator('#profile-message')).toContainText('another tab');
  await expect(page.locator('#talent-points')).toContainText('0 / 8');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(durable);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).marker, RECOVERY_KEY)).toBe('original');
  await other.close(); await page.reload();
  await expect(page.locator('#edit-talents')).toHaveText('Talents (1/8)');
});
