import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { collectUntilChoice, playerPosition, seedRuns, startGame } from './game-helpers';

async function insideViewport(page: Page, locator: Locator): Promise<void> {
  const box = (await locator.boundingBox())!, viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(-1); expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test('keep the full HUD, arena and thumb controls visible across small, portrait, landscape and desktop sizes', async ({ page }, testInfo) => {
  const { canvas, errors } = await startGame(page);
  for (const [width, height] of [[320, 568], [280, 700], [360, 640], [568, 320], [844, 390], [768, 1024], [1280, 720]]) {
    const previous = page.viewportSize()!;
    const rotates = (previous.width > previous.height) !== (width! > height!);
    await page.setViewportSize({ width: width!, height: height! });
    await page.clock.runFor(64);
    // Native media-query events arrive independently of the mocked RAF clock.
    if (rotates) await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
    if (await page.getByRole('button', { name: 'Resume run' }).isVisible()) await page.locator('#start-run').click();
    await page.clock.runFor(64);
    await expect(page.locator('#pause-run')).toBeVisible();
    for (const selector of ['#run-hud', '#arena', '#pause-run']) await insideViewport(page, page.locator(selector));
    const bounds = (await canvas.boundingBox())!;
    expect(bounds.width).toBeGreaterThan(140);
    expect(bounds.width / bounds.height).toBeCloseTo(.75, 2);
    const pause = (await page.locator('#pause-run').boundingBox())!;
    expect(pause.width).toBeGreaterThanOrEqual(44); expect(pause.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect.poll(() => canvas.evaluate((node) => Math.abs((node as HTMLCanvasElement).width - Math.round(node.getBoundingClientRect().width * Math.min(2, devicePixelRatio))))).toBeLessThan(2);
    if (width === 320 || width === 568) await page.screenshot({ path: testInfo.outputPath(`play-${width}x${height}.png`) });
  }
  expect(errors).toEqual([]);
});

test('clear held keys and real pointer capture after resize, focus loss and capture loss', async ({ page }) => {
  const { canvas, errors } = await startGame(page);
  await page.keyboard.down('KeyD'); await page.clock.runFor(200);
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width - 20, height: size.height });
  await page.clock.runFor(64);
  const resized = await playerPosition(canvas);
  await page.keyboard.down('KeyD'); await page.clock.runFor(200);
  expect(Math.abs((await playerPosition(canvas)).x - resized.x)).toBeLessThan(2);
  await page.keyboard.up('KeyD'); await page.keyboard.down('KeyD'); await page.clock.runFor(200); await page.keyboard.up('KeyD');
  expect((await playerPosition(canvas)).x - resized.x).toBeGreaterThan(15);

  await page.keyboard.down('KeyA'); await page.locator('#pause-run').focus();
  const unfocused = await playerPosition(canvas); await page.clock.runFor(200);
  expect(Math.abs((await playerPosition(canvas)).x - unfocused.x)).toBeLessThan(2);
  await page.keyboard.up('KeyA');
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .6);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * .5 - 60, bounds.y + bounds.height * .6);
  await page.clock.runFor(200); await expect(page.locator('#joystick')).toBeVisible();
  // Release the browser's actual capture rather than dispatching a fake end event.
  await canvas.evaluate((node) => {
    for (let id = 0; id < 16; id++) if (node.hasPointerCapture(id)) node.releasePointerCapture(id);
  });
  await page.mouse.move(bounds.x + bounds.width * .5 - 65, bounds.y + bounds.height * .6);
  await expect(page.locator('#joystick')).toBeHidden();
  const released = await playerPosition(canvas); await page.clock.runFor(200);
  expect(Math.abs((await playerPosition(canvas)).x - released.x)).toBeLessThan(2);
  await page.mouse.up();
  await canvas.focus(); await page.keyboard.down('KeyW'); await page.clock.runFor(200); await page.keyboard.up('KeyW');
  expect(released.y - (await playerPosition(canvas)).y).toBeGreaterThan(15);
  expect(errors).toEqual([]);
});

test('pause for reading and settings without stealing focus or resuming on Escape in a control', async ({ page }, testInfo) => {
  const { errors } = await startGame(page);
  const activate = (locator: Locator) => testInfo.project.use.hasTouch ? locator.tap() : locator.click();
  for (const id of ['presentation-settings', 'enemy-guide', 'run-build']) {
    const summary = page.locator(`#${id} summary`).first();
    await activate(summary);
    await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
    await expect(summary).toBeFocused();
    expect(await page.locator('#arena').evaluate((node) => getComputedStyle(node).touchAction)).not.toBe('none');
    expect(await page.locator('#arena').evaluate((node) => (node as HTMLElement).inert)).toBe(true);
    const frozen = await page.locator('#run-time').textContent();
    await page.clock.runFor(1000); await expect(page.locator('#run-time')).toHaveText(frozen!);
    if (id === 'presentation-settings') {
      await page.locator('#sound-volume').focus(); await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
      await page.locator('#motion-preference').focus(); await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
    }
    await activate(summary); await activate(page.getByRole('button', { name: 'Resume run' }));
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }
  expect(errors).toEqual([]);
});

test('inspect and allocate talents on a small phone, rotate the editor, and use saved-build fields without movement', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const activate = (locator: Locator) => testInfo.project.use.hasTouch ? locator.tap() : locator.click();
  await activate(page.locator('#edit-talents'));
  const editor = page.locator('#talent-editor');
  await insideViewport(page, editor);
  await activate(editor.getByRole('button', { name: /Inspect Iron Reprisal/ }));
  await expect(editor.getByRole('tooltip')).toContainText('retaliate');
  await activate(editor.locator('#allocate-talent'));
  await expect(editor.locator('#talent-points')).toContainText('1 / 8');
  await expect(editor.locator('#close-talents')).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 568, height: 320 });
  await insideViewport(page, editor);
  await editor.getByRole('tab', { name: /Warrior/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(editor.getByRole('tab', { name: /Mage/ })).toBeFocused();
  await activate(editor.locator('#profile-panel > summary'));
  await editor.locator('#build-name').fill('WASD explorer');
  await activate(editor.locator('#save-build'));
  await expect(editor.locator('#profile-message')).toContainText('saved');
  expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  const font = await editor.locator('#build-name').evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  expect(font).toBeGreaterThanOrEqual(16);
  await page.screenshot({ path: testInfo.outputPath('landscape-build-editor.png') });
  await activate(editor.locator('#close-talents'));
  await expect(page.locator('#edit-talents')).toBeFocused();
});

test('native upgrade modal blocks outside focus, fits after rotation, and returns to fresh movement', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await seedRuns(page);
  const { canvas, errors } = await startGame(page);
  await page.clock.runFor(12_000); await collectUntilChoice(page, canvas);
  const dialog = page.locator('#upgrade-picker');
  await expect(dialog).toHaveJSProperty('open', true);
  await page.locator('#presentation-summary').evaluate((node) => (node as HTMLElement).focus());
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  for (const size of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(size); await page.clock.runFor(64);
    await insideViewport(page, dialog);
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
  }
  if (testInfo.project.use.hasTouch) {
    await dialog.evaluate((node) => { node.scrollTop = 0; });
    const bounds = (await dialog.boundingBox())!;
    const point = { id: 1, x: Math.round(bounds.x + bounds.width * .5), y: Math.round(bounds.y + bounds.height - 30) };
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    for (let move = 0; move < 4; move++) {
      point.y -= 30;
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => dialog.evaluate((node) => node.scrollTop)).toBeGreaterThan(30);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await session.detach();
  }
  const last = dialog.locator('button').last();
  await last.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('landscape-choice.png') });
  if (testInfo.project.use.hasTouch) await last.tap(); else await last.click();
  await expect(dialog).toBeHidden(); await expect(canvas).toBeFocused();
  const before = await playerPosition(canvas);
  await page.keyboard.down('KeyA'); await page.clock.runFor(250); await page.keyboard.up('KeyA');
  expect(before.x - (await playerPosition(canvas)).x).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('visibility interruption freezes a run and never resumes from a visible event or stale held input', async ({ page }) => {
  const { canvas, errors } = await startGame(page);
  await page.keyboard.down('KeyD'); await page.clock.runFor(200);
  // Headless tabs stay visible: exercise the visibility boundary with an explicit
  // browser-property fixture, without altering the run, clock or input handlers.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('button', { name: 'Resume run' })).toBeVisible();
  const frozen = await playerPosition(canvas), time = await page.locator('#run-time').textContent();
  await page.clock.runFor(5000); expect(await playerPosition(canvas)).toEqual(frozen);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(1000); await expect(page.locator('#run-time')).toHaveText(time!);
  await page.getByRole('button', { name: 'Resume run' }).click();
  await page.keyboard.down('KeyD'); await page.clock.runFor(200);
  expect(Math.abs((await playerPosition(canvas)).x - frozen.x)).toBeLessThan(2);
  await page.keyboard.up('KeyD'); await page.keyboard.down('KeyD'); await page.clock.runFor(200); await page.keyboard.up('KeyD');
  expect((await playerPosition(canvas)).x - frozen.x).toBeGreaterThan(15);
  expect(errors).toEqual([]);
});
