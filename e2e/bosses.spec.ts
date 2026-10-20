import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { seedRuns } from './game-helpers';
import { SAVE_KEY } from '../src/persistence/profile-store';

test('complete fifteen minutes, fight three guardians, claim victory, respec, reload and replay', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await seedRuns(page);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  // Only the frame-time input is accelerated. Combat, upgrades, boss HP and rewards are real.
  // The test pilot sends ordinary movement key events based on the visible HUD clock.
  await page.addInitScript(() => {
    const seen: Record<string, boolean> = {};
    Object.assign(window, { observedBosses: seen });
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => original((time) => {
      const clock = document.querySelector('#run-time')?.textContent?.split(':').map(Number);
      if (clock?.length === 2) {
        const code = ['KeyW', 'KeyD', 'KeyS', 'KeyA'][Math.floor((clock[0]! * 60 + clock[1]!) / 3) % 4]!;
        for (const key of ['KeyW', 'KeyD', 'KeyS', 'KeyA']) window.dispatchEvent(new KeyboardEvent(key === code ? 'keydown' : 'keyup', { code: key, cancelable: true }));
      }
      callback(time * 12);
      const name = document.querySelector('#boss-name')?.textContent;
      if (name && !(document.querySelector('#boss-hud') as HTMLElement).hidden) seen[name.split(' · ')[0]!] = true;
    });
    const fillRect = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function (...args: Parameters<typeof fillRect>) {
      if (this.fillStyle === '#b0b7be') seen.knightArt = true;
      if (this.fillStyle === '#be8a68') seen.sovereignArt = true;
      return Reflect.apply(fillRect, this, args);
    };
    const fill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function (...args: [fillRule?: CanvasFillRule] | [path: Path2D, fillRule?: CanvasFillRule]) {
      if (this.fillStyle === '#ab82b2') seen.matronArt = true;
      return Reflect.apply(fill, this, args);
    };
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function (...args: [] | [Path2D]) {
      if (this.strokeStyle === '#f0c986' && this.getLineDash().length) seen.warning = true;
      if (this.strokeStyle === '#ffb488') seen.activeDanger = true;
      return Reflect.apply(stroke, this, args);
    };
  });
  await page.goto('/');
  const activate = async (locator: Locator) => testInfo.project.use.hasTouch ? locator.tap() : locator.click();
  await activate(page.locator('#edit-talents'));
  const editor = page.getByRole('dialog', { name: 'Classless talents' });
  await activate(editor.getByRole('tab', { name: /Mage/ }));
  for (const name of ['Arcane Echo', 'Rime Sigil', 'Chain Spark', 'Shatterglass', 'Mana Ward', 'Riftweaver']) {
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${name}`) }));
    if (await editor.locator('#research-talent').isVisible()) await activate(editor.locator('#research-talent'));
    await activate(editor.locator('#allocate-talent'));
  }
  await activate(editor.getByRole('tab', { name: /Priest/ }));
  for (const name of ['Ember Communion', 'Searing Grace']) {
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${name}`) })); await activate(editor.locator('#allocate-talent'));
  }
  await activate(editor.locator('#close-talents')); await activate(page.locator('#start-run'));
  let pausedBoss = false, photographed = false;
  for (let batch = 0; batch < 340; batch++) {
    while (await page.locator('#upgrade-picker').isVisible()) {
      for (const id of ['vitality', 'haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst']) {
        const card = page.locator(`[data-upgrade="${id}"]`);
        if (await card.isVisible()) { await activate(card); break; }
      }
    }
    if (await page.locator('#return-to-build').isVisible()) break;
    if (await page.locator('#boss-hud').isVisible()) {
      if (!pausedBoss) {
        await activate(page.locator('#pause-run'));
        const time = await page.locator('#run-time').textContent(), health = await page.locator('#boss-health').getAttribute('value');
        await page.clock.runFor(1000);
        await expect(page.locator('#run-time')).toHaveText(time!); expect(await page.locator('#boss-health').getAttribute('value')).toBe(health);
        await activate(page.locator('#start-run')); pausedBoss = true;
      }
      if (!photographed && (await page.locator('#boss-name').textContent())?.includes('Night Sovereign')) {
        await page.clock.runFor(100); await page.screenshot({ path: testInfo.outputPath('final-guardian.png'), fullPage: true }); photographed = true;
      }
    }
    await page.clock.runFor(250);
  }
  await expect(page.locator('#overlay-title')).toHaveText('Dawn breaks');
  await expect(page.locator('#run-time')).toHaveText('15:00');
  await expect(page.locator('#run-results')).toContainText('3/3 guardians');
  await expect(page.locator('#run-reward')).toContainText('insight earned');
  const seen = await page.evaluate(() => (window as unknown as { observedBosses: Record<string, boolean> }).observedBosses);
  for (const key of ['Ossuary Knight', 'Veil Matron', 'Night Sovereign', 'knightArt', 'matronArt', 'sovereignArt', 'warning', 'activeDanger']) expect(seen[key], key).toBe(true);
  expect(pausedBoss).toBe(true);
  await activate(page.locator('#result-build summary'));
  await expect(page.locator('#result-talents')).toContainText('Rime Sigil'); await expect(page.locator('#result-upgrades')).toContainText('Quickened Ember');
  await page.screenshot({ path: testInfo.outputPath('victory.png'), fullPage: true });
  const completed = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).completedRuns as number, SAVE_KEY);
  expect(completed).toBe(1);
  await page.clock.runFor(5000); await expect(page.locator('#run-time')).toHaveText('15:00');
  await activate(page.locator('#return-to-build')); await activate(editor.locator('#respec-talents'));
  await expect(editor.locator('#talent-points')).toContainText('0 / 8');
  await activate(editor.locator('#close-talents')); await page.reload();
  await expect(page.locator('#edit-talents')).toHaveText('Talents (0/8)');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.completedRuns).toBe(1); expect(saved.lastResult.outcome).toBe('victory'); expect(saved.activeRun).toBeNull();
  await activate(page.locator('#start-run')); await expect(page.locator('#run-time')).toHaveText('00:00');
  await expect(page.locator('#campaign-progress')).toContainText('0/3 guardians'); await expect(page.locator('#boss-hud')).toBeHidden();
  expect(await page.locator('.shell').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});
