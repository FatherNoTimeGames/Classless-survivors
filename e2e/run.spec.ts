import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../src/persistence/profile-store';
import { collectUntilChoice, playerPosition, seedRuns, startGame, choosePreferredUpgrade } from './game-helpers';

test('keyboard movement, pause, and focus loss preserve the run and clear held input', async ({ page }) => {
  const { canvas, errors } = await startGame(page);
  const before = await playerPosition(canvas);
  await page.keyboard.down('KeyD');
  await page.clock.runFor(500);
  await page.keyboard.up('KeyD');
  const right = await playerPosition(canvas);
  expect(right.x - before.x).toBeGreaterThan(45);
  expect(right.x - before.x).toBeLessThan(60);
  await page.keyboard.down('ArrowUp');
  await page.clock.runFor(400);
  await page.keyboard.up('ArrowUp');
  expect((await playerPosition(canvas)).y).toBeLessThan(right.y - 35);

  await page.keyboard.down('KeyA');
  await page.clock.runFor(100);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume run' })).toBeFocused();
  const pausedAt = await playerPosition(canvas);
  const pausedTime = await page.locator('#run-time').textContent();
  await page.clock.runFor(5000);
  await expect(page.locator('#run-time')).toHaveText(pausedTime!);
  expect(await playerPosition(canvas)).toEqual(pausedAt);
  await page.keyboard.press('Escape');
  // A second down while still held generates the browser's repeat-key event.
  await page.keyboard.down('KeyA');
  await page.clock.runFor(250);
  // Still physically holding A cannot restart movement after the pause cleared it.
  // Sprite bobbing and overlaid bolts can shift the sampled pixel centroid slightly.
  expect(Math.abs((await playerPosition(canvas)).x - pausedAt.x)).toBeLessThan(2);
  await page.keyboard.up('KeyA');

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Resume run' }).click();
  await page.keyboard.down('KeyS');
  await page.clock.runFor(100);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
  const blurredAt = await playerPosition(canvas);
  await page.clock.runFor(5000);
  expect(await playerPosition(canvas)).toEqual(blurredAt);
  await page.getByRole('button', { name: 'Resume run' }).click();
  await page.clock.runFor(250);
  expect(Math.abs((await playerPosition(canvas)).y - blurredAt.y)).toBeLessThan(3);
  await page.keyboard.up('KeyS');
  expect(errors).toEqual([]);
});

test('automatic combat earns XP, ends in defeat, and restarts with clean stats', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await seedRuns(page);
  const { canvas, errors } = await startGame(page);
  await page.clock.runFor(12_000);
  expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('combat.png'), fullPage: true });
  // Collect visible shards before testing eventual defeat; ranged foes keep their distance.
  await collectUntilChoice(page, canvas);

  for (let elapsed = 12; elapsed < 180; elapsed += 5) {
    if (await page.getByRole('button', { name: 'Try again' }).isVisible()) break;
    while (await page.getByRole('dialog').isVisible()) {
      // Deliberately choose utility/survival first to retain a vulnerable starter build.
      await choosePreferredUpgrade(page, ['fleet', 'magnet', 'vitality', 'haste', 'fork', 'pierce', 'burst'], Boolean(testInfo.project.use.hasTouch));
    }
    await page.clock.runFor(5000);
  }
  await expect(page.getByRole('heading', { name: 'The ember fades' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Talents (0/8)', exact: true })).toBeVisible();
  await expect(page.locator('#health-text')).toHaveText(/^0 \/ \d+$/);
  await expect(page.locator('#health')).toHaveJSProperty('value', 0);
  expect(Number(await page.locator('#run-xp').textContent())).toBeGreaterThan(0);
  await expect(page.locator('#run-results')).toContainText('XP gathered');
  const earned = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(earned.completedRuns).toBe(1); expect(earned.activeRun).toBeNull();
  await expect(page.locator('#run-reward')).toContainText('insight earned');
  const endedTime = await page.locator('#run-time').textContent();
  await page.clock.runFor(5000);
  await expect(page.locator('#run-time')).toHaveText(endedTime!);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#health-text')).toHaveText('60 / 60');
  await expect(page.locator('#run-xp')).toHaveText('0');
  await expect(page.locator('#run-kills')).toHaveText('0');
  await expect(page.locator('#run-time')).toHaveText('00:00');
  await expect(page.locator('#run-level')).toHaveText('1');
  await expect(page.locator('#ember-stats')).toContainText('0.70s cooldown');
  await expect(page.locator('#run-overlay')).toBeHidden();
  await page.clock.runFor(1500);
  await expect(page.locator('#run-time')).toHaveText('00:01');
  await page.reload();
  const reloaded = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(reloaded.completedRuns).toBe(1); expect(reloaded.insight).toBe(earned.insight);
  await page.locator('#edit-talents').click();
  await expect(page.locator('#save-status')).toContainText('unfinished run was discarded');
  await page.locator('#close-talents').click();
  await page.locator('#start-run').click();
  const restarted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(restarted.activeRun).toBeGreaterThan(earned.lastResult.id);
  expect(restarted.completedRuns).toBe(1);
  expect(errors).toEqual([]);
});
