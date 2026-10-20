import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** Control the normal run-seed input, without exposing or changing game state. */
export async function seedRuns(page: Page, seed = 42): Promise<void> {
  await page.addInitScript((value) => {
    const original = crypto.getRandomValues;
    Object.defineProperty(crypto, 'getRandomValues', {
      value<T extends ArrayBufferView>(array: T): T {
        if (array instanceof Uint32Array && array.length === 1) {
          array[0] = value;
          return array;
        }
        Reflect.apply(original, crypto, [array]);
        return array;
      },
    });
  }, seed);
}

export async function startGame(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  // Drive real animation frames quickly, without a production debug API or fake state.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the clearing' }).click();
  const canvas = page.getByRole('img', { name: /pixel-art sanctuary/ });
  await expect(canvas).toBeFocused();
  await page.clock.runFor(32);
  return { canvas, errors };
}

/** Locate the visible head pixels rather than exposing internal game state. */
export async function playerPosition(canvas: Locator) {
  return canvas.evaluate((node) => {
    const surface = node as HTMLCanvasElement;
    const data = surface.getContext('2d')!.getImageData(0, 0, surface.width, surface.height).data;
    let count = 0;
    let x = 0;
    let y = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] === 232 && data[index + 1] === 220 && data[index + 2] === 192) {
        count++;
        x += (index / 4) % surface.width;
        y += Math.floor(index / 4 / surface.width);
      }
    }
    if (!count) throw new Error('The player head was not rendered.');
    return { x: x / count / surface.width * 360, y: y / count / surface.height * 480 };
  });
}
