import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { playerPosition, startGame } from './game-helpers';

async function firstShard(canvas: Locator) {
  return canvas.evaluate((node) => {
    const surface = node as HTMLCanvasElement;
    const data = surface.getContext('2d')!.getImageData(0, 0, surface.width, surface.height).data;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] === 116 && data[index + 1] === 203 && data[index + 2] === 170) {
        return { x: (index / 4 % surface.width) / surface.width * 360,
          y: Math.floor(index / 4 / surface.width) / surface.height * 480 };
      }
    }
    return null;
  });
}

/** Navigate to real rendered pickups; no injected XP or internal game state. */
async function collectUntilChoice(page: Page, canvas: Locator): Promise<void> {
  await canvas.focus();
  for (let attempt = 0; attempt < 140; attempt++) {
    if (await page.getByRole('dialog').isVisible()) return;
    const shard = await firstShard(canvas);
    const keys: string[] = [];
    if (shard) {
      const player = await playerPosition(canvas);
      const dx = shard.x - player.x;
      const dy = shard.y - (player.y + 8);
      if (Math.abs(dx) > 6) keys.push(dx > 0 ? 'KeyD' : 'KeyA');
      if (Math.abs(dy) > 6) keys.push(dy > 0 ? 'KeyS' : 'KeyW');
    }
    for (const key of keys) await page.keyboard.down(key);
    await page.clock.runFor(250);
    for (const key of keys) await page.keyboard.up(key);
  }
  throw new Error('Collecting actual pickups did not produce a level choice.');
}

test('collect XP, freeze for a keyboard/touch choice, improve an ability, level again, and reset', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const { canvas, errors } = await startGame(page);
  await page.clock.runFor(12_000);
  await collectUntilChoice(page, canvas);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName('Level 2 — choose your ember');
  await expect(dialog.locator('button')).toHaveCount(3);
  const time = await page.locator('#run-time').textContent();
  const health = await page.locator('#health-text').textContent();
  await page.clock.runFor(5000);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#run-time')).toHaveText(time!);
  await expect(page.locator('#health-text')).toHaveText(health!);
  await expect(page.locator('#joystick')).toBeHidden();
  expect(await canvas.evaluate((node) => (node as HTMLElement).inert)).toBe(true);
  const first = dialog.locator('button').first();
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator('button').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('level-choice.png'), fullPage: true });

  const haste = page.getByRole('button', { name: /Quickened Ember/ });
  if (testInfo.project.use.hasTouch) await haste.tap();
  else { await haste.focus(); await page.keyboard.press('Enter'); }
  await expect(dialog).toBeHidden();
  await expect(canvas).toBeFocused();
  await expect(page.locator('#run-level')).toHaveText('2');
  await page.locator('#run-build summary').click();
  await expect(page.locator('#active-upgrades')).toContainText('Quickened Ember 1/4');
  await expect(page.locator('#ember-stats')).toContainText('0.62s cooldown');
  await page.locator('#run-build summary').click();
  await collectUntilChoice(page, canvas);
  await expect(dialog).toHaveAccessibleName('Level 3 — choose your ember');
  await expect(dialog.locator('.rare')).toHaveCount(0);
  const selected = dialog.locator('button').first();
  if (testInfo.project.use.hasTouch) await selected.tap();
  else await selected.click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#run-level')).toHaveText('3');
  const resumedAt = await page.locator('#run-time').textContent();
  await page.clock.runFor(1100);
  expect(await page.locator('#run-time').textContent()).not.toBe(resumedAt);

  await page.reload();
  await page.getByRole('button', { name: 'Enter the clearing' }).click();
  await expect(page.locator('#run-level')).toHaveText('1');
  await expect(page.locator('#run-xp')).toHaveText('0');
  await expect(page.locator('#ember-stats')).toContainText('0.70s cooldown');
  await expect(page.locator('#active-upgrades')).toContainText('No upgrades yet');
  expect(errors).toEqual([]);
});
