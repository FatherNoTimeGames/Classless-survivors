import { UPGRADES, upgradeRank } from '../content/upgrades';
import type { UpgradeBonuses, UpgradeRanks } from '../content/upgrades';
import { RULES } from './rules';

export type RunStats = Required<UpgradeBonuses>;
const STAT_BONUSES = UPGRADES.flatMap((upgrade) =>
  (Object.keys(upgrade.bonuses) as (keyof UpgradeBonuses)[]).map((key) => ({ id: upgrade.id, key, amount: upgrade.bonuses[key]! })));

/** Derive from ranks, never increment cached stats: refunds/resets cannot drift. */
export function getRunStats(ranks: UpgradeRanks): RunStats {
  const stats: RunStats = {
    attackInterval: RULES.attackInterval, projectileCount: 1, pierce: 0, blastRadius: 0,
    moveSpeed: RULES.playerSpeed, magnetRadius: RULES.magnetRadius, maxHealth: RULES.maxHealth,
  };
  for (const bonus of STAT_BONUSES) stats[bonus.key] += bonus.amount * upgradeRank(ranks, bonus.id);
  return stats;
}
