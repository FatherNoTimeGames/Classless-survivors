import { UPGRADES } from '../content/upgrades';
import type { UpgradeBonuses, UpgradeRanks } from '../content/upgrades';
import { RULES } from './rules';

export type RunStats = Required<UpgradeBonuses>;

/** Derive from ranks, never increment cached stats: refunds/resets cannot drift. */
export function getRunStats(ranks: UpgradeRanks): RunStats {
  const stats: RunStats = {
    attackInterval: RULES.attackInterval, projectileCount: 1, pierce: 0, blastRadius: 0,
    moveSpeed: RULES.playerSpeed, magnetRadius: RULES.magnetRadius, maxHealth: RULES.maxHealth,
  };
  for (const upgrade of UPGRADES) {
    const rank = Math.max(0, Math.min(upgrade.maxRank, ranks[upgrade.id] ?? 0));
    for (const key of Object.keys(upgrade.bonuses) as (keyof UpgradeBonuses)[]) {
      stats[key] += upgrade.bonuses[key]! * rank;
    }
  }
  return stats;
}
