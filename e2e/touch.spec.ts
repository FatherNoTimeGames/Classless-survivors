import { expect, test } from '@playwright/test';
import { playerPosition, startGame } from './game-helpers';

test('touch drag moves, ignores a second finger, and releases on end or cancellation without scrolling', async ({ page }, testInfo) => {
  const { canvas, errors } = await startGame(page);
  const session = await page.context().newCDPSession(page);
  const bounds = (await canvas.boundingBox())!;
  const point = { id: 1, x: Math.round(bounds.x + bounds.width * 0.35), y: Math.round(bounds.y + bounds.height * 0.65) };
  const second = { id: 2, x: point.x + 80, y: point.y - 60 };
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const before = await playerPosition(canvas);

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  point.x += 60;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  await page.clock.runFor(400);
  expect((await playerPosition(canvas)).x - before.x).toBeGreaterThan(35);
  await expect(page.locator('#joystick')).toBeVisible();
  // Full-page capture resizes a tall tablet page, deliberately clearing pointer
  // capture through the app's resize handler. Keep this active gesture in its viewport.
  await page.screenshot({ path: testInfo.outputPath('touch-control.png') });

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point, second] });
  // Releasing the controlling finger while another is down must stop movement.
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [point] });
  const released = await playerPosition(canvas);
  await page.clock.runFor(300);
  expect(Math.abs((await playerPosition(canvas)).x - released.x)).toBeLessThan(2);
  await expect(page.locator('#joystick')).toBeHidden();
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  point.y -= 60;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  await page.clock.runFor(300);
  expect((await playerPosition(canvas)).y).toBeLessThan(released.y - 25);
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  const cancelled = await playerPosition(canvas);
  await page.clock.runFor(300);
  expect(Math.abs((await playerPosition(canvas)).y - cancelled.y)).toBeLessThan(3);
  await expect(page.locator('#joystick')).toBeHidden();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  expect(await canvas.evaluate((node) => getComputedStyle(node).touchAction)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await session.detach();
});
