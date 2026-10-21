import { upgradeRank } from '../content/upgrades';
import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
import type { Companion, Run } from './state';
import { COMPANIONS } from '../content/companions';
import { STEP } from './rules';
import { clamp } from './geometry';
import { nearestEnemy } from './targeting';
import { damageEnemy } from './damage';
import { addSpark } from './effects';
import { fireVolley } from './projectiles';
import { attackInterval } from './attack-timing';

function strike(run: Run, companion: Companion): boolean {
  const definition = COMPANIONS[companion.kind];
  const rank = upgradeRank(run.progression.ranks, 'familiar');
  const range = definition.range + rank * U.companionRange;
  const target = nearestEnemy(run.enemies, run.player, range);
  if (!target) { companion.targetId = null; return false; }
  companion.targetId = target.id;
  const damage = definition.damage + rank * U.companionDamage + companion.bonusDamage;
  if (definition.mode === 'projectile') {
    if (!fireVolley(run, companion, run.player, range, {
      damage, source: 'summon', school: definition.school,
    })) return false; // Keep the stored bonus/cooldown if the projectile budget is full.
    companion.attackIn = attackInterval(run, definition.interval);
    companion.bonusDamage = 0;
    addSpark(run, companion, 'imp');
  } else {
    companion.x = clamp(target.x, 12, run.world.width - 12);
    companion.y = clamp(target.y - 16, 12, run.world.height - 12);
    companion.attackIn = attackInterval(run, definition.interval);
    companion.bonusDamage = 0;
    damageEnemy(run, target, damage, { source: 'summon', school: definition.school });
    addSpark(run, target, 'falcon');
  }
  return true;
}

export function updateCompanions(run: Run): void {
  for (const companion of run.companions) {
    const definition = COMPANIONS[companion.kind];
    companion.attackIn = Math.max(0, companion.attackIn - STEP);
    if (companion.attackIn === 0 && strike(run, companion)) continue;
    // Return toward the player between strikes; rendering never updates companion positions.
    const follow = Math.min(1, STEP * 6);
    companion.x += (clamp(run.player.x + definition.offsetX, 12, run.world.width - 12) - companion.x) * follow;
    companion.y += (clamp(run.player.y + definition.offsetY, 12, run.world.height - 12) - companion.y) * follow;
  }
}

/** Wild Hunt bypasses each companion's current timer, but resets it after a real strike. */
export function commandCompanions(run: Run): void {
  for (const companion of run.companions) strike(run, companion);
}
