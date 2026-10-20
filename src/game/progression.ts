import { PROGRESSION_RULES, UPGRADES } from '../content/upgrades';
import type { UpgradeDefinition, UpgradeId, UpgradeRanks } from '../content/upgrades';
import type { Run } from './state';
import { random } from './random';
import { getRunStats } from './stats';
import { healPlayer } from './healing';
import { rescaleAttackTimers } from './attack-timing';

export function xpForLevel(level: number): number {
  return PROGRESSION_RULES.firstLevelXp + (level - 1) * PROGRESSION_RULES.extraXpPerLevel;
}

export function choiceLevel(run: Run): number {
  return run.progression.level - run.progression.pendingLevels + 1;
}

export function eligibleUpgrades(level: number, ranks: UpgradeRanks): UpgradeDefinition[] {
  return UPGRADES.filter((upgrade) => level >= upgrade.minLevel && (ranks[upgrade.id] ?? 0) < upgrade.maxRank);
}

function rollOffers(run: Run): UpgradeId[] {
  let pool = eligibleUpgrades(choiceLevel(run), run.progression.ranks);
  const offers: UpgradeId[] = [];
  while (pool.length && offers.length < PROGRESSION_RULES.offerCount) {
    // Always include one weapon option when one is eligible, then draw freely.
    const weapons = pool.filter((upgrade) => upgrade.category === 'weapon');
    const candidates = offers.length === 0 && weapons.length ? weapons : pool;
    let roll = random(run.progression) * candidates.reduce((sum, upgrade) => sum + PROGRESSION_RULES.rarityWeights[upgrade.rarity], 0);
    let selected = candidates[candidates.length - 1]!;
    for (const candidate of candidates) {
      roll -= PROGRESSION_RULES.rarityWeights[candidate.rarity];
      if (roll < 0) { selected = candidate; break; }
    }
    offers.push(selected.id);
    pool = pool.filter((upgrade) => upgrade.id !== selected.id);
  }
  // Shuffle slots so the guaranteed weapon is not always the first button.
  for (let index = offers.length - 1; index > 0; index--) {
    const other = Math.floor(random(run.progression) * (index + 1));
    [offers[index], offers[other]] = [offers[other]!, offers[index]!];
  }
  return offers;
}

function prepareChoice(run: Run): void {
  run.progression.offers = rollOffers(run);
  if (run.progression.offers.length) run.status = 'choosing';
  else {
    // Defensive recovery if a future content change exhausts the pool early.
    run.progression.pendingLevels = 0;
    run.status = 'running';
  }
}

export function awardXp(run: Run, amount: number): void {
  if ((run.status === 'defeated' || run.status === 'victory') || !Number.isFinite(amount) || amount < 1) return;
  const xp = Math.floor(amount);
  run.xp += xp;
  const progress = run.progression;
  if (progress.level === PROGRESSION_RULES.maxLevel) return;
  progress.xpIntoLevel += xp;
  while (progress.level < PROGRESSION_RULES.maxLevel && progress.xpIntoLevel >= xpForLevel(progress.level)) {
    progress.xpIntoLevel -= xpForLevel(progress.level);
    progress.level++;
    progress.pendingLevels++;
  }
  if (progress.level === PROGRESSION_RULES.maxLevel) progress.xpIntoLevel = 0;
  if (progress.pendingLevels && progress.offers.length === 0) prepareChoice(run);
}

/** Only a currently offered, eligible choice can spend a queued level reward. */
export function chooseUpgrade(run: Run, id: string): boolean {
  if (run.status !== 'choosing' || run.progression.pendingLevels <= 0) return false;
  const upgrade = eligibleUpgrades(choiceLevel(run), run.progression.ranks).find((entry) => entry.id === id);
  if (!upgrade || !run.progression.offers.includes(upgrade.id)) return false;
  const before = getRunStats(run.progression.ranks);
  run.progression.ranks[upgrade.id] = (run.progression.ranks[upgrade.id] ?? 0) + 1;
  const after = getRunStats(run.progression.ranks);
  healPlayer(run, after.maxHealth - before.maxHealth);
  if (after.attackInterval !== before.attackInterval) rescaleAttackTimers(run, after.attackInterval / before.attackInterval);
  run.progression.pendingLevels--;
  run.progression.offers = [];
  if (run.progression.pendingLevels > 0) prepareChoice(run);
  else run.status = 'running';
  return true;
}
