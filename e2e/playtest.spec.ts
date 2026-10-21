import { expect, test } from '@playwright/test';
import { playerPosition, startGame, seedRuns } from './game-helpers';
import { SAVE_KEY } from '../src/persistence/profile-store';

test('one fixed game window contains the arena and internally scrolling menus', async ({ page }, testInfo) => {
  await page.goto('/');
  const touch = Boolean(testInfo.project.use.hasTouch);
  const activate = (selector: string) => touch ? page.locator(selector).tap() : page.locator(selector).click();
  const fixed = async () => {
    expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, overflow: document.documentElement.scrollHeight > innerHeight })))
      .toEqual({ x: 0, y: 0, overflow: false });
    const arena = (await page.locator('#arena').boundingBox())!, viewport = page.viewportSize()!;
    expect(arena.width).toBeCloseTo(viewport.width, 0);
    expect(arena.height).toBeGreaterThan(viewport.height * .55);
  };
  await fixed(); await page.mouse.wheel(0, 900); await fixed();
  await activate('#open-menu'); await expect(page.locator('#game-menu')).toHaveJSProperty('open', true);
  await activate('#enemy-guide summary'); await page.locator('#enemy-guide li').last().scrollIntoViewIfNeeded(); await fixed();
  await activate('#close-menu'); await activate('#edit-talents');
  await page.locator('#profile-panel > summary').click(); await page.locator('#build-name').fill('Single window');
  await fixed(); await activate('#close-talents');
  await activate('#start-run'); await fixed();
  const aspect = await page.locator('#arena').evaluate((node) => {
    const canvas = node as HTMLCanvasElement, bounds = canvas.getBoundingClientRect();
    return { actual: Number(canvas.dataset.worldWidth) / Number(canvas.dataset.worldHeight), expected: bounds.width / bounds.height };
  });
  expect(aspect.actual).toBeCloseTo(aspect.expected, 4);
  await page.screenshot({ path: testInfo.outputPath('single-window.png') });
});

test('pause-menu abandonment keeps completed progress, consumes no reward and allows respec/replay', async ({ page }, testInfo) => {
  await seedRuns(page);
  const { errors } = await startGame(page);
  await page.clock.runFor(3000);
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  await expect(page.locator('#abandon-run')).toBeHidden();
  const activate = (selector: string) => testInfo.project.use.hasTouch ? page.locator(selector).tap() : page.locator(selector).click();
  await activate('#pause-run'); await expect(page.locator('#abandon-run')).toBeVisible();
  await activate('#abandon-run');
  await expect(page.locator('#overlay-title')).toHaveText('Run abandoned');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.activeRun).toBeNull(); expect(saved.completedRuns).toBe(before.completedRuns);
  expect(saved.insight).toBe(before.insight); expect(saved.lastResult).toEqual(before.lastResult);
  await activate('#return-to-build');
  await page.getByRole('button', { name: /Inspect Iron Reprisal/ }).click(); await page.locator('#allocate-talent').click();
  await page.locator('#respec-talents').click(); await expect(page.locator('#talent-points')).toContainText('0 / 8');
  await activate('#close-talents');
  await activate('#start-run'); await expect(page.locator('#run-time')).toHaveText('00:00');
  const next = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(next.activeRun).toBe(before.activeRun + 1); expect(errors).toEqual([]);
});

test('guardian countdown decreases during play and freezes while paused', async ({ page }) => {
  await startGame(page);
  await expect(page.locator('#next-guardian')).toHaveText('Next guardian in 03:00');
  await page.clock.runFor(2100); await expect(page.locator('#next-guardian')).toHaveText('Next guardian in 02:58');
  await page.locator('#pause-run').click(); const frozen = await page.locator('#next-guardian').textContent();
  await page.clock.runFor(5000); await expect(page.locator('#next-guardian')).toHaveText(frozen!);
});

test('a fresh short-landscape run gives the arena full height beside its HUD', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  const { canvas, errors } = await startGame(page);
  const field = (await canvas.boundingBox())!, hud = (await page.locator('#run-hud').boundingBox())!;
  expect(field.height).toBeCloseTo(320, 0); expect(field.width + hud.width).toBeCloseTo(568, 0);
  const aspect = await canvas.evaluate((node) => Number((node as HTMLCanvasElement).dataset.worldWidth) / Number((node as HTMLCanvasElement).dataset.worldHeight));
  expect(aspect).toBeCloseTo(field.width / field.height, 4);
  const before = await playerPosition(canvas);
  await page.keyboard.down('KeyA'); await page.clock.runFor(250); await page.keyboard.up('KeyA');
  expect(before.x - (await playerPosition(canvas)).x).toBeGreaterThan(20); expect(errors).toEqual([]);
});
