import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { seedRuns, choosePreferredUpgrade } from './game-helpers';

test('play mixed waves, see all silhouettes and attack warnings, and pause hostile effects', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await seedRuns(page);
  await page.addInitScript(() => {
    const seen: Record<string, boolean> = {};
    Object.assign(window, { observedEnemies: seen });
    const blocks: Record<string, string> = { '#6b3b4a': 'husk', '#82aa82': 'skitter', '#c4b7a0': 'archer', '#b17c50': 'charger' };
    const strokes: Record<string, string> = { '#d58f8b': 'arrowWarning', '#e4a46d': 'chargeWarning', '#d6a2cf': 'blightWarning', '#b587b4': 'blight', '#f08e87': 'arrow', '#e6c36e': 'elite' };
    const fillRect = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function (...args: Parameters<typeof fillRect>) {
      const feature = blocks[String(this.fillStyle)]; if (feature) seen[feature] = true;
      return Reflect.apply(fillRect, this, args);
    };
    const fill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function (...args: [fillRule?: CanvasFillRule] | [path: Path2D, fillRule?: CanvasFillRule]) {
      if (this.fillStyle === '#77618f') seen.hexer = true;
      return Reflect.apply(fill, this, args);
    };
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function (...args: [] | [Path2D]) {
      const feature = strokes[String(this.strokeStyle)]; if (feature) seen[feature] = true;
      return Reflect.apply(stroke, this, args);
    };
  });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  const activate = async (locator: Locator) => testInfo.project.use.hasTouch ? locator.tap() : locator.click();
  await activate(page.locator('#enemy-guide summary'));
  await expect(page.locator('#enemy-guide')).toContainText('Stuns interrupt attacks');
  await activate(page.locator('#enemy-guide summary'));
  await activate(page.locator('#edit-talents'));
  const editor = page.getByRole('dialog', { name: 'Classless talents' });
  await activate(editor.getByRole('tab', { name: /Priest/ }));
  for (const name of ['Ember Communion', 'Searing Grace', 'Sanctuary', 'Atonement', 'Martyr Ward', 'Dawn Chorus']) {
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${name}`) }));
    if (await editor.locator('#research-talent').isVisible()) await activate(editor.locator('#research-talent'));
    await activate(editor.locator('#allocate-talent'));
  }
  await activate(editor.getByRole('tab', { name: /Warrior/ }));
  for (const name of ['Iron Reprisal', 'Sweeping Blade']) {
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${name}`) })); await activate(editor.locator('#allocate-talent'));
  }
  await activate(editor.locator('#close-talents')); await activate(page.locator('#start-run'));
  const required = ['husk', 'skitter', 'archer', 'charger', 'hexer', 'arrowWarning', 'chargeWarning', 'blightWarning', 'blight', 'arrow', 'elite'];
  let observed: Record<string, boolean> = {};
  for (let frame = 0; frame < 400; frame++) {
    while (await page.locator('#upgrade-picker').isVisible()) {
      await choosePreferredUpgrade(page, ['vitality', 'haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst'], Boolean(testInfo.project.use.hasTouch));
    }
    if (await page.getByRole('button', { name: 'Try again', exact: true }).isVisible()) break;
    const clock = (await page.locator('#run-time').textContent())!.split(':').map(Number);
    const seconds = clock[0]! * 60 + clock[1]!;
    const direction = ['KeyW', 'KeyD', 'KeyS', 'KeyA'][Math.floor(seconds / 3) % 4]!;
    await page.keyboard.down(direction); await page.clock.runFor(500); await page.keyboard.up(direction);
    observed = await page.evaluate(() => (window as unknown as { observedEnemies: Record<string, boolean> }).observedEnemies);
    if (required.every((key) => observed[key])) break;
  }
  for (const key of required) expect(observed[key], `Missing rendered enemy feature: ${key}`).toBe(true);
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeHidden();
  expect(Number((await page.locator('#wave-label').textContent())!.match(/Wave (\d+)/)![1])).toBeGreaterThanOrEqual(5);
  // The discovery frame can also earn a level. Finish its choices before pausing.
  while (await page.locator('#upgrade-picker').isVisible()) {
    await choosePreferredUpgrade(page, ['vitality', 'haste', 'magnet', 'fleet', 'fork', 'pierce', 'burst'], Boolean(testInfo.project.use.hasTouch));
  }
  await expect(page.locator('#upgrade-picker')).toBeHidden();
  await expect(page.locator('#pause-run')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mixed-waves.png'), fullPage: true });
  await activate(page.locator('#pause-run'));
  const pausedTime = await page.locator('#run-time').textContent();
  await page.clock.runFor(5000); await expect(page.locator('#run-time')).toHaveText(pausedTime!);
  await expect(page.locator('#enemy-count')).toContainText('foes');
  expect(await page.locator('.shell').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});
