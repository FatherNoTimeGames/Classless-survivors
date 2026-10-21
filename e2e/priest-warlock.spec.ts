import { menuSection } from './game-helpers';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { seedRuns, choosePreferredUpgrade } from './game-helpers';

const branches = {
  Priest: ['Ember Communion', 'Searing Grace', 'Sanctuary', 'Atonement', 'Martyr Ward', 'Dawn Chorus'],
  Warlock: ['Soul Cinder', 'Agony', 'Grim Pact', 'Detonation', 'Soul Link', 'Harvest'],
} as const;

for (const branch of ['Priest', 'Warlock'] as const) {
  test(`${branch} branch mixes with support talents and produces healing or curse combat feedback`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seedRuns(page);
    await page.addInitScript(() => {
      const seen = { ward: false, holy: false, heal: false, imp: false, curse: false, detonation: false };
      Object.assign(window, { observedDevotion: seen });
      const lines = new WeakMap<CanvasRenderingContext2D, number>();
      const beginPath = CanvasRenderingContext2D.prototype.beginPath;
      CanvasRenderingContext2D.prototype.beginPath = function () {
        lines.set(this, 0);
        return beginPath.call(this);
      };
      const lineTo = CanvasRenderingContext2D.prototype.lineTo;
      CanvasRenderingContext2D.prototype.lineTo = function (...args: Parameters<typeof lineTo>) {
        lines.set(this, (lines.get(this) ?? 0) + 1);
        return Reflect.apply(lineTo, this, args);
      };
      const original = CanvasRenderingContext2D.prototype.stroke;
      CanvasRenderingContext2D.prototype.stroke = function (...args: [] | [Path2D]) {
        if (this.strokeStyle === '#8fbddc') seen.ward = true;
        if (this.strokeStyle === '#ffe4a1') seen.holy = true;
        // Healing draws a cross; XP pickup rings share its color but contain no lines.
        if (this.strokeStyle === '#91e2ba' && (lines.get(this) ?? 0) > 0) seen.heal = true;
        if (this.strokeStyle === '#bd9be8') seen.curse = true;
        if (this.strokeStyle === '#d6a4ed') seen.detonation = true;
        return Reflect.apply(original, this, args);
      };
      const fillRect = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect = function (...args: Parameters<typeof fillRect>) {
        if (this.fillStyle === '#ca8d9a') seen.imp = true;
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
    await expect(editor.locator('#talent-catalog-status')).toContainText('36 / 36 talents playable');
    await expect(editor.locator('#talent-catalog-status')).toContainText('All branches are ready to mix');
    await activate(editor.getByRole('tab', { name: new RegExp(branch) }));
    await expect(editor.locator('.talent-icon')).toHaveCount(6);
    for (const talent of branches[branch]) {
      await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
      if (await editor.locator('#research-talent').isVisible()) await activate(editor.locator('#research-talent'));
      await activate(editor.getByRole('button', { name: 'Allocate point' }));
    }
    await expect(editor.locator('.selected-link')).toHaveCount(6);
    await expect(editor.locator('#talent-points')).toContainText('6 / 8');
    expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${branch.toLowerCase()}-tree.png`), fullPage: true });
    const support = branch === 'Priest' ? ['Warrior', 'Iron Reprisal', 'Sweeping Blade'] : ['Priest', 'Ember Communion', 'Searing Grace'];
    await activate(editor.getByRole('tab', { name: new RegExp(support[0]!) }));
    for (const talent of support.slice(1)) {
      await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
      if (await editor.locator('#research-talent').isVisible()) await activate(editor.locator('#research-talent'));
      await activate(editor.getByRole('button', { name: 'Allocate point' }));
    }
    await expect(editor.locator('#talent-points')).toContainText('8 / 8');
    await activate(editor.getByRole('button', { name: 'Close talent editor' }));
    await page.getByRole('button', { name: 'Enter the clearing' }).click();
    const seen = () => page.evaluate(() => (window as unknown as { observedDevotion: Record<string, boolean> }).observedDevotion);
    const choosePending = async () => {
      while (await page.locator('#upgrade-picker').isVisible()) {
        await choosePreferredUpgrade(page, ['vitality', 'fleet', 'magnet', 'haste', 'fork', 'pierce', 'burst'], Boolean(testInfo.project.use.hasTouch));
      }
    };
    for (let seconds = 0; seconds < 120; seconds += 2) {
      await choosePending();
      if (await page.getByRole('button', { name: 'Try again' }).isVisible()) break;
      const direction = seconds % 12 < 6 ? 'KeyW' : 'KeyS';
      await page.keyboard.down(direction);
      await page.clock.runFor(2000);
      await page.keyboard.up(direction);
      const cues = await seen();
      if (branch === 'Priest' ? cues.ward && cues.holy && cues.heal : cues.imp && cues.curse && cues.detonation) break;
    }
    const cues = await seen();
    if (branch === 'Priest') {
      expect(cues.ward).toBe(true); expect(cues.holy).toBe(true); expect(cues.heal).toBe(true);
    } else {
      expect(cues.imp).toBe(true); expect(cues.curse).toBe(true); expect(cues.detonation).toBe(true);
    }
    expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
    await choosePending();
    await page.clock.runFor(32);
    await page.screenshot({ path: testInfo.outputPath(`${branch.toLowerCase()}-combat.png`), fullPage: true });
    expect(await page.locator('.shell').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await menuSection(page, '#run-build summary');
    await expect(page.locator('#active-talents li')).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}
