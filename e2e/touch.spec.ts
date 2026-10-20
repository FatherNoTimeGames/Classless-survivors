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
  second.x -= 40;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point, second] });
  const withSecond = await playerPosition(canvas);
  await page.clock.runFor(200);
  expect((await playerPosition(canvas)).x - withSecond.x).toBeGreaterThan(15);
  // Lifting the non-controlling finger must leave the original drag active.
  // CDP sends the ending points here, not the points remaining on the screen.
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [second] });
  const secondaryLifted = await playerPosition(canvas);
  await page.clock.runFor(200);
  expect((await playerPosition(canvas)).x - secondaryLifted.x).toBeGreaterThan(15);
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

test('touch capture is cleared by rotation and a new drag works after explicit resume', async ({ page }, testInfo) => {
  const { canvas, errors } = await startGame(page);
  const session = await page.context().newCDPSession(page);
  const bounds = (await canvas.boundingBox())!;
  const point = { id: 1, x: Math.round(bounds.x + bounds.width * .4), y: Math.round(bounds.y + bounds.height * .7) };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  point.x += 50;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  await page.clock.runFor(200);
  const original = page.viewportSize()!;
  await page.setViewportSize({ width: original.height, height: original.width });
  await page.clock.runFor(64);
  await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
  await expect(page.locator('#joystick')).toBeHidden();
  const frozen = await playerPosition(canvas);
  await page.clock.runFor(1000);
  expect(await playerPosition(canvas)).toEqual(frozen);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.getByRole('button', { name: 'Resume run' }).tap();
  await page.clock.runFor(200);
  const resumed = await playerPosition(canvas);
  expect(Math.abs(resumed.x - frozen.x)).toBeLessThan(2);
  const rotated = (await canvas.boundingBox())!;
  point.x = Math.round(rotated.x + rotated.width * .5); point.y = Math.round(rotated.y + rotated.height * .65);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  point.x -= 50;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  await page.clock.runFor(250);
  expect(resumed.x - (await playerPosition(canvas)).x).toBeGreaterThan(20);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.screenshot({ path: testInfo.outputPath('rotated-touch.png') });
  expect(errors).toEqual([]);
  await session.detach();
});
