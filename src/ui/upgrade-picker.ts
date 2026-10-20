import { abilitySummary } from '../game/ability-summary';
import { UPGRADES } from '../content/upgrades';
import type { UpgradeId } from '../content/upgrades';
import type { Run } from '../game/state';
import { choiceLevel } from '../game/progression';
import { element } from './dom';

/** Accessible choice UI; validation and effects belong to progression/combat. */
export function createUpgradePicker(root: HTMLElement, onChoose: (id: UpgradeId) => void) {
  const title = element('#upgrade-title', root);
  const note = element('#upgrade-note', root);
  const choices = element('#upgrade-choices', root);
  const events = new AbortController();
  root.addEventListener('keydown', (event) => {
    const buttons = [...root.querySelectorAll<HTMLElement>('summary, button')];
    if (event.key === 'Tab') {
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      if (buttons.length) { event.preventDefault(); buttons[next]!.focus(); }
    }
    if (event.key === 'Escape') event.preventDefault();
  }, { signal: events.signal });

  return {
    show(run: Run): void {
      title.textContent = `Level ${choiceLevel(run)} — choose your ember`;
      note.textContent = run.progression.pendingLevels > 1
        ? `Combat is paused. ${run.progression.pendingLevels} level rewards remain. Choose one upgrade for each.`
        : 'Combat is paused. Choose one upgrade for this run.';
      element('#upgrade-build', root).textContent = abilitySummary(run).join(' ');
      choices.replaceChildren();
      for (const id of run.progression.offers) {
        const upgrade = UPGRADES.find((entry) => entry.id === id)!;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `upgrade-choice ${upgrade.rarity}`;
        button.dataset.upgrade = id;
        const header = document.createElement('span');
        header.className = 'choice-heading';
        const name = document.createElement('strong');
        name.textContent = upgrade.name;
        const rarity = document.createElement('span');
        rarity.className = 'rarity';
        rarity.textContent = upgrade.fallback ? 'recovery' : upgrade.rarity;
        header.append(name, rarity);
        const description = document.createElement('span');
        description.className = 'choice-description';
        description.textContent = upgrade.description;
        const rank = document.createElement('span');
        rank.className = 'choice-rank';
        rank.textContent = upgrade.fallback ? 'Immediate recovery · no lasting stat increase' : `Rank ${(run.progression.ranks[id] ?? 0) + 1} / ${upgrade.maxRank}${upgrade.needs ? ` · Works with: ${upgrade.needs.join(' + ')}` : ' · Any build'}`;
        button.append(header, description, rank);
        button.addEventListener('click', () => onChoose(id), { once: true });
        choices.append(button);
      }
      root.hidden = false;
      root.scrollTop = 0;
      choices.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    },
    hide(): void { root.hidden = true; },
    destroy(): void { events.abort(); choices.replaceChildren(); },
  };
}
