import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

test('inspect six branches, allocate and refund prerequisites, respec, and run a mixed build', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  const activate = async (locator: Locator) => {
    if (testInfo.project.use.hasTouch) await locator.tap();
    else await locator.click();
  };
  await activate(page.getByRole('button', { name: 'Talents (0/8)', exact: true }));
  const editor = page.getByRole('dialog', { name: 'Classless talents' });
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('tab')).toHaveCount(6);
  await expect(editor.locator('.talent-node')).toHaveCount(6);
  await expect(editor.locator('#talent-catalog-status')).toContainText('36 / 36 talents playable');

  await editor.getByRole('tab', { name: /Warrior/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(editor.getByRole('tab', { name: /Mage/ })).toBeFocused();
  await expect(editor.getByRole('tab', { name: /Mage/ })).toHaveAttribute('aria-selected', 'true');
  await activate(editor.getByRole('tab', { name: /Priest/ }));
  await activate(editor.getByRole('button', { name: /Inspect Sanctuary/ }));
  await expect(editor.locator('#talent-availability')).toContainText('requires Ember Communion');
  await expect(editor.getByRole('button', { name: 'Allocate point' })).toBeDisabled();
  await expect(editor.getByRole('tooltip')).toContainText('XP shard');

  await activate(editor.getByRole('tab', { name: /Priest/ }));
  await activate(editor.getByRole('button', { name: /Inspect Searing Grace/ }));
  await expect(editor.locator('#talent-requires')).toHaveText('Requires: Ember Communion');
  await expect(editor.getByRole('button', { name: 'Allocate point' })).toBeDisabled();
  await activate(editor.getByRole('button', { name: /Inspect Ember Communion/ }));
  await activate(editor.getByRole('button', { name: 'Allocate point' }));
  await activate(editor.getByRole('button', { name: /Inspect Searing Grace/ }));
  await activate(editor.getByRole('button', { name: 'Allocate point' }));
  await expect(editor.locator('#talent-points')).toContainText('2 / 8');
  await expect(editor.locator('.selected-link')).toHaveCount(1);
  await activate(editor.getByRole('button', { name: /Inspect Ember Communion/ }));
  await activate(editor.getByRole('button', { name: 'Refund', exact: true }));
  await expect(editor.locator('#talent-points')).toContainText('0 / 8');
  await expect(editor.locator('#talent-message')).toContainText('2 points refunded');

  for (const [branch, talent] of [['Warrior', 'Iron Reprisal'], ['Mage', 'Arcane Echo'], ['Rogue', 'Expose Weakness']]) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch!) }));
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
    await activate(editor.getByRole('button', { name: 'Allocate point' }));
  }
  for (const [branch, talent] of [['Priest', 'Ember Communion'], ['Warlock', 'Soul Cinder'], ['Hunter', 'Hunting Momentum']]) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch!) }));
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
    await activate(editor.getByRole('button', { name: 'Allocate point' }));
  }
  await expect(editor.locator('#talent-points')).toContainText('6 / 8');
  await activate(editor.getByRole('tab', { name: /Warrior/ }));
  for (const talent of ['Sweeping Blade', 'Spellsteel']) {
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
    await activate(editor.getByRole('button', { name: 'Allocate point' }));
  }
  await expect(editor.getByRole('tooltip')).toContainText('non-periodic physical hits');
  await expect(editor.getByRole('tooltip')).toContainText('Inherits projectile upgrades');
  await expect(editor.getByRole('tooltip')).toContainText('0.25 seconds');
  await expect(editor.getByRole('button', { name: 'Close talent editor' })).toBeInViewport();
  expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('synergy-description.png'), fullPage: true });
  await expect(editor.locator('#talent-points')).toContainText('8 / 8');
  await activate(editor.getByRole('button', { name: /Inspect Frostbreak/ }));
  await expect(editor.getByRole('button', { name: 'Allocate point' })).toBeDisabled();
  await activate(editor.getByRole('button', { name: 'Free respec', exact: true }));
  await expect(editor.locator('#talent-points')).toContainText('0 / 8');
  await expect(editor.getByRole('button', { name: 'Free respec' })).toBeDisabled();

  for (const [branch, talent] of [['Warrior', 'Iron Reprisal'], ['Mage', 'Arcane Echo'], ['Rogue', 'Expose Weakness']]) {
    await activate(editor.getByRole('tab', { name: new RegExp(branch!) }));
    await activate(editor.getByRole('button', { name: new RegExp(`Inspect ${talent}`) }));
    await activate(editor.getByRole('button', { name: 'Allocate point' }));
  }
  expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await expect(editor.getByRole('button', { name: 'Close talent editor' })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('talent-tree.png'), fullPage: true });
  await activate(editor.getByRole('button', { name: 'Close talent editor' }));
  await expect(editor).toBeHidden();
  await expect(page.getByRole('button', { name: 'Talents (3/8)', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Enter the clearing' }).click();
  await page.clock.runFor(12_000);
  await expect(page.locator('#edit-talents')).toBeHidden();
  await page.locator('#run-build summary').click();
  await expect(page.locator('#active-talents li')).toHaveCount(3);
  await expect(page.locator('#active-talents')).toContainText('Iron Reprisal');
  await expect(page.locator('#active-talents')).toContainText('Arcane Echo');
  await expect(page.locator('#active-talents')).toContainText('Expose Weakness');
  expect(Number(await page.locator('#run-kills').textContent())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('#edit-talents')).toBeHidden();
  await expect(editor).toBeHidden();
  expect(errors).toEqual([]);
});
