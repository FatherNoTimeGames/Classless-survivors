import { expect, test } from '@playwright/test';

test('production shell renders the sanctuary locally and survives resizing', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => errors.push(`Request failed: ${request.url()}`));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page).toHaveTitle('Classless Survivors');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Classless Survivors');
  const canvas = page.getByRole('img', { name: /pixel-art sanctuary/ });
  await expect(canvas).toBeVisible();
  await expect(page.getByRole('alert')).toBeHidden();

  const inspectScene = () => canvas.evaluate((element) => {
    const surface = element as HTMLCanvasElement;
    const context = surface.getContext('2d')!;
    const { data } = context.getImageData(0, 0, surface.width, surface.height);
    const colors = new Set<string>();
    for (let index = 0; index < data.length; index += 64) {
      colors.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
    }
    const bounds = surface.getBoundingClientRect();
    return {
      colors: colors.size,
      width: surface.width,
      height: surface.height,
      expectedWidth: Math.round(bounds.width * Math.min(2, window.devicePixelRatio)),
      expectedHeight: Math.round(bounds.height * Math.min(2, window.devicePixelRatio)),
      cssRatio: bounds.width / bounds.height,
    };
  });

  await expect.poll(async () => (await inspectScene()).colors).toBeGreaterThan(12);
  let scene = await inspectScene();
  expect(scene.width).toBe(scene.expectedWidth);
  expect(scene.height).toBe(scene.expectedHeight);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('sanctuary.png'), fullPage: true });

  // Exercise an actual ResizeObserver update, including the 280px minimum layout.
  await page.setViewportSize({ width: 280, height: 700 });
  await expect.poll(async () => {
    const resized = await inspectScene();
    return resized.width === resized.expectedWidth && resized.height === resized.expectedHeight;
  }).toBe(true);
  scene = await inspectScene();
  expect(scene.colors).toBeGreaterThan(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // The skip link must be keyboard reachable and move focus to the section.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to sanctuary' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'An ember in the dark' })).toBeFocused();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});
