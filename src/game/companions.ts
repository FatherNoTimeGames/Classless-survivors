import type { Companion, Run } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { STEP, WORLD } from './rules';
import { clamp } from './geometry';
import { nearestEnemy } from './targeting';
import { damageEnemy } from './damage';
import { addSpark } from './effects';

function strike(run: Run, companion: Companion): boolean {
  const target = nearestEnemy(run.enemies, run.player, T.falconRange);
  if (!target) { companion.targetId = null; return false; }
  companion.targetId = target.id;
  companion.x = clamp(target.x, 12, WORLD.width - 12);
  companion.y = clamp(target.y - 16, 12, WORLD.height - 12);
  companion.attackIn = T.falconInterval;
  damageEnemy(run, target, T.falconDamage, { source: 'summon', school: 'physical' });
  addSpark(run, target, 'falcon');
  return true;
}

export function updateCompanions(run: Run): void {
  for (const companion of run.companions) {
    companion.attackIn = Math.max(0, companion.attackIn - STEP);
    if (companion.attackIn === 0 && strike(run, companion)) continue;
    // Return toward the player between strikes; rendering never updates companion positions.
    const follow = Math.min(1, STEP * 6);
    companion.x += (clamp(run.player.x - 20, 12, WORLD.width - 12) - companion.x) * follow;
    companion.y += (clamp(run.player.y - 24, 12, WORLD.height - 12) - companion.y) * follow;
  }
}

/** Wild Hunt bypasses each companion's current timer, but resets it after a real strike. */
export function commandCompanions(run: Run): void {
  for (const companion of run.companions) strike(run, companion);
}
