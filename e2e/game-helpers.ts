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
export async function collectUntilChoice(page: Page, canvas: Locator): Promise<void> {
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

/** Pick a preferred visible upgrade, or a valid new offer when the preferred pool is capped. */
export async function choosePreferredUpgrade(page: Page, priority: readonly string[], touch = false): Promise<void> {
  const offered = await page.locator('#upgrade-choices button').evaluateAll((buttons) => buttons.map((button) => (button as HTMLElement).dataset.upgrade!));
  const id = priority.find((candidate) => offered.includes(candidate)) ?? offered[0];
  if (!id) throw new Error('A pending level has no upgrade offers.');
  const card = page.locator(`[data-upgrade="${id}"]`);
  if (touch) await card.tap(); else await card.click();
}

/** Accelerate only RAF time and send movement keys from the visible clock; never mutate combat state. */
export async function installRunPilot(page: Page): Promise<void> {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => original((time) => {
      const clock = document.querySelector('#run-time')?.textContent?.split(':').map(Number);
      if (clock?.length === 2) {
        const code = ['KeyW', 'KeyD', 'KeyS', 'KeyA'][Math.floor((clock[0]! * 60 + clock[1]!) / 3) % 4]!;
        for (const key of ['KeyW', 'KeyD', 'KeyS', 'KeyA']) window.dispatchEvent(new KeyboardEvent(key === code ? 'keydown' : 'keyup', { code: key, cancelable: true }));
      }
      callback(time * 12);
    });
  });
}
