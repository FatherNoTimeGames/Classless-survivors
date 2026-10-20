import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

test('allocate both complete branches, then play a Warrior build with real cleave and ward feedback', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    // Observe actual drawing calls; no game state injection or production debug API.
    const seen = { cleave: false, ward: false };
    Object.assign(window, { observedCombat: seen });
    const original = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function (...args: [] | [Path2D]) {
      if (this.strokeStyle === '#ece0bf') seen.cleave = true;
      if (this.strokeStyle === '#8fbddc') seen.ward = true;
      return Reflect.apply(original, this, args);
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
  for (const [branch, talents] of [
    ['Mage', ['Arcane Echo', 'Rime Sigil', 'Chain Spark', 'Shatterglass', 'Mana Ward', 'Riftweaver']],
    ['Warrior', ['Iron Reprisal', 'Sweeping Blade', 'Spellsteel', 'Frostbreak', 'Iron Ward', 'Last Stand']],
  ] as const) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch) }));
    await expect(editor.locator('.talent-icon')).toHaveCount(6);
    for (const talent of talents) {
      await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
      await activate(editor.getByRole('button', { name: 'Allocate point' }));
    }
    await expect(editor.locator('#talent-points')).toContainText('6 / 6');
    await expect(editor.locator('.selected-link')).toHaveCount(6);
    expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${branch.toLowerCase()}-tree.png`), fullPage: true });
    if (branch === 'Mage') await activate(editor.getByRole('button', { name: 'Free respec', exact: true }));
  }
  await activate(editor.getByRole('button', { name: 'Close talent editor' }));
  await page.getByRole('button', { name: 'Enter the clearing' }).click();
  const seen = () => page.evaluate(() => (window as unknown as { observedCombat: { cleave: boolean; ward: boolean } }).observedCombat);
  for (let seconds = 0; seconds < 180; seconds += 2) {
    while (await page.locator('#upgrade-picker').isVisible()) {
      // Utility choices retain close-range encounters, rather than buffing ember damage.
      for (const id of ['fleet', 'magnet', 'vitality', 'haste', 'fork', 'pierce', 'burst']) {
        const card = page.locator(`[data-upgrade="${id}"]`);
        if (await card.isVisible()) { await activate(card); break; }
      }
    }
    if (await page.getByRole('button', { name: 'Try again' }).isVisible()) break;
    // Walk toward the far edge then back through approaching foes, exercising close combat.
    const direction = seconds % 12 < 6 ? 'KeyW' : 'KeyS';
    await page.keyboard.down(direction);
    await page.clock.runFor(2000);
    await page.keyboard.up(direction);
    const feedback = await seen();
    if (feedback.cleave && feedback.ward) break;
  }
  expect(await seen()).toEqual({ cleave: true, ward: true });
  expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('warrior-combat.png'), fullPage: true });
  expect(errors).toEqual([]);
});
