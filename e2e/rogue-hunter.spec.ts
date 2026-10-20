import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { seedRuns } from './game-helpers';

const branches = {
  Rogue: ['Expose Weakness', 'Venom Edge', 'Killer Instinct', 'Siphon Toxin', 'Contagion', 'Nightfall'],
  Hunter: ['Hunting Momentum', 'Falcon Companion', 'Snaring Shot', 'Pack Link', 'Frost Trap', 'Wild Hunt'],
} as const;

for (const branch of ['Rogue', 'Hunter'] as const) {
  test(`${branch} builds mix with support talents and produce real companion/status feedback`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    await seedRuns(page);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const seen = { falcon: false, poison: false, critical: false, snare: false, frost: false };
      Object.assign(window, { observedHybrid: seen });
      const stroke = CanvasRenderingContext2D.prototype.stroke;
      CanvasRenderingContext2D.prototype.stroke = function (...args: [] | [Path2D]) {
        if (this.strokeStyle === '#ffe9ad') seen.critical = true;
        if (this.strokeStyle === '#93b58a') seen.snare = true;
        if (this.strokeStyle === '#a5dce8') seen.frost = true;
        if (this.strokeStyle === '#a8c978') seen.poison = true;
        return Reflect.apply(stroke, this, args);
      };
      const fill = CanvasRenderingContext2D.prototype.fill;
      CanvasRenderingContext2D.prototype.fill = function (...args: [CanvasFillRule?] | [Path2D, CanvasFillRule?]) {
        if (this.fillStyle === '#c5d6bd') seen.falcon = true;
        return Reflect.apply(fill, this, args);
      };
      const fillRect = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect = function (...args: Parameters<typeof fillRect>) {
        if (this.fillStyle === '#a8c978') seen.poison = true;
        return Reflect.apply(fillRect, this, args);
      };
    });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await page.goto('/');
    const activate = async (locator: Locator) => {
      if (testInfo.project.use.hasTouch) await locator.tap();
      else await locator.click();
    };
    await activate(page.locator('#edit-talents'));
    const editor = page.getByRole('dialog', { name: 'Classless talents' });
    await activate(editor.getByRole('tab', { name: new RegExp(branch) }));
    await expect(editor.locator('.talent-icon')).toHaveCount(6);
    for (const talent of branches[branch]) {
      await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
      await activate(editor.getByRole('button', { name: 'Allocate point' }));
    }
    await expect(editor.locator('.selected-link')).toHaveCount(6);
    await expect(editor.locator('#talent-points')).toContainText('6 / 8');
    await page.screenshot({ path: testInfo.outputPath(`${branch.toLowerCase()}-tree.png`), fullPage: true });
    const support = branch === 'Rogue' ? 'Hunter' : 'Rogue';
    await activate(editor.getByRole('tab', { name: new RegExp(support) }));
    for (const talent of branches[support].slice(0, 2)) {
      await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
      await activate(editor.getByRole('button', { name: 'Allocate point' }));
    }
    await expect(editor.locator('#talent-points')).toContainText('8 / 8');
    await activate(editor.getByRole('button', { name: 'Close talent editor' }));
    await page.getByRole('button', { name: 'Enter the clearing' }).click();
    const seen = () => page.evaluate(() => (window as unknown as { observedHybrid: Record<string, boolean> }).observedHybrid);
    for (let seconds = 0; seconds < 120; seconds += 2) {
      while (await page.locator('#upgrade-picker').isVisible()) {
        for (const id of ['fleet', 'magnet', 'vitality', 'haste', 'fork', 'pierce', 'burst']) {
          const card = page.locator(`[data-upgrade="${id}"]`);
          if (await card.isVisible()) { await activate(card); break; }
        }
      }
      if (await page.getByRole('button', { name: 'Try again' }).isVisible()) break;
      const direction = seconds % 12 < 6 ? 'KeyW' : 'KeyS';
      await page.keyboard.down(direction);
      await page.clock.runFor(2000);
      await page.keyboard.up(direction);
      const cues = await seen();
      if (cues.falcon && cues.poison && (branch === 'Rogue' ? cues.critical : cues.snare && cues.frost)) break;
    }
    const cues = await seen();
    expect(cues.falcon).toBe(true);
    expect(cues.poison).toBe(true);
    if (branch === 'Rogue') expect(cues.critical).toBe(true);
    else { expect(cues.snare).toBe(true); expect(cues.frost).toBe(true); }
    expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath(`${branch.toLowerCase()}-hybrid.png`), fullPage: true });
    await page.locator('#run-build summary').click();
    await expect(page.locator('#active-talents li')).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}
