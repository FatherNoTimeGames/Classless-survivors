import { abilitySummary } from '../game/ability-summary';
import { BOSSES } from '../content/bosses';
import { talentById } from '../content/talents';
import { UPGRADES } from '../content/upgrades';
import type { Run } from '../game/state';
import { element, formatTime } from './dom';

/** Results are a read-only snapshot; reward claiming stays at the profile boundary. */
export function showRunResults(run: Run): void {
  const victory = run.status === 'victory';
  element('#overlay-title').textContent = victory ? 'Dawn breaks' : run.finishReason === 'timeout' ? 'The night endures' : 'The ember fades';
  element('#overlay-description').textContent = victory ? 'All three guardians have fallen. You carried the ember into the dawn.'
    : run.finishReason === 'timeout' ? 'Dawn arrived with guardians still standing. Defeat all three before 15:00 to break the night.'
      : 'The dark has taken this clearing. Rise and try again.';
  const results = element('#run-results'); results.hidden = false;
  results.textContent = `${formatTime(run.elapsed)} survived · ${run.kills} slain · ${run.xp} XP gathered · Level ${run.progression.level} · ${run.campaign.defeated.length}/${BOSSES.length} guardians`;
  element('#result-abilities').textContent = abilitySummary(run).join(' ');
  element('#result-talents').textContent = run.talents.map((id) => talentById(id)!.name).join(', ') || 'No talents selected.';
  element('#result-upgrades').textContent = UPGRADES.filter((upgrade) => run.progression.ranks[upgrade.id]).map((upgrade) => `${upgrade.name} ${run.progression.ranks[upgrade.id]}`).join(', ') || 'No run upgrades.';
  const build = element<HTMLDetailsElement>('#result-build');
  build.open = false; build.hidden = false;
  element<HTMLButtonElement>('#start-run').textContent = victory ? 'Play again' : 'Try again';
}
