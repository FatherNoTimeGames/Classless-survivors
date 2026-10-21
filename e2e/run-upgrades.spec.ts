import { menuSection } from './game-helpers';
import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { seedRuns, installRunPilot, choosePreferredUpgrade } from './game-helpers';

test('choose usable family upgrades, inspect changed abilities, and reset run-only synergies', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await seedRuns(page, 1); await installRunPilot(page); await page.goto('/');
  const activate = async (node: Locator) => testInfo.project.use.hasTouch ? node.tap() : node.click();
  await activate(page.locator('#edit-talents'));
  const editor = page.getByRole('dialog', { name: 'Classless talents' });
  for (const [branch, talents] of [
    ['Warrior', ['Iron Reprisal', 'Sweeping Blade', 'Frostbreak']],
    ['Hunter', ['Hunting Momentum', 'Falcon Companion', 'Pack Link']],
    ['Priest', ['Ember Communion', 'Searing Grace']],
  ] as const) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch) }));
    for (const name of talents) { await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${name}`) })); await activate(editor.locator('#allocate-talent')); }
  }
  await activate(editor.locator('#close-talents')); await activate(page.locator('#start-run'));
  // Seed 1 offers this four-part package within the eight-slot budget. Other seeds
  // legitimately require different combinations; this is a UI synergy fixture.
  const chosen = new Set<string>();
  const priority = ['longblade', 'familiar', 'icebrand', 'frost-pact', 'vitality', 'haste', 'wellspring', 'aegis', 'magnet', 'fleet'];
  for (let batch = 0; batch < 210; batch++) {
    while (await page.locator('#upgrade-picker').isVisible()) {
      await expect(page.locator('#upgrade-note')).toContainText('Combat is paused');
      if (!chosen.has('venom')) await expect(page.locator('[data-upgrade="potency"]')).toBeHidden(); // This build has no periodic effects yet.
      const offered = await page.locator('#upgrade-choices button').evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.upgrade!));
      const id = priority.find((id) => offered.includes(id)) ?? offered[0]!;
      // Once the desired package is complete, stop before unrelated periodic unlocks change the eligibility assertion.
      chosen.add(id); await choosePreferredUpgrade(page, priority, Boolean(testInfo.project.use.hasTouch));
    }
    if (['longblade', 'familiar', 'icebrand', 'frost-pact'].every((id) => chosen.has(id))) break;
    await expect(page.locator('#return-to-build')).toBeHidden();
    await page.clock.runFor(250);
  }
  for (const id of ['longblade', 'familiar', 'icebrand', 'frost-pact']) expect(chosen.has(id), id).toBe(true);
  await activate(page.locator('#pause-run')); await menuSection(page, '#run-build summary');
  const summary = page.locator('#ability-summary');
  await expect(summary).toContainText('Blade:'); await expect(summary).toContainText('Falcon:');
  await expect(summary).toContainText('shares on-hit talents'); await expect(summary).toContainText('Wintersteel'); await expect(summary).toContainText('Winter Pact');
  await expect(page.locator('#active-upgrades')).toContainText('Grave Longblade'); await expect(page.locator('#active-upgrades .upgrade-detail').first()).not.toBeEmpty();
  await page.screenshot({ path: testInfo.outputPath('hybrid-upgrade-summary.png'), fullPage: true });
  expect(await page.locator('.shell').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.reload(); await activate(page.locator('#start-run')); await activate(page.locator('#pause-run')); await menuSection(page, '#run-build summary');
  await expect(page.locator('#active-upgrades')).toContainText('No upgrades yet');
  await expect(page.locator('#ability-summary')).not.toContainText('Winter Pact'); await expect(page.locator('#ability-summary')).toContainText('50 range');
  expect(errors).toEqual([]);
});
