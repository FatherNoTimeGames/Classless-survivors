import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
import { upgradeRank } from '../content/upgrades';
import { STEP } from './rules';
import { grantShield } from './shields';
import type { Run } from './state';

export function updateUpgradeTimers(run: Run): void {
  const memory = run.upgradeMemory;
  for (const key of ['aegisIn', 'riposteIn', 'catalystIn', 'benedictionIn', 'pactIn'] as const) memory[key] = Math.max(0, memory[key] - STEP);
  const rank = upgradeRank(run.progression.ranks, 'aegis');
  if (rank && memory.aegisIn === 0 && run.enemies.some((foe) => foe.health > 0)) {
    memory.aegisIn = U.aegisInterval;
    grantShield(run, U.aegisAmount * rank, U.aegisDuration);
  }
}
