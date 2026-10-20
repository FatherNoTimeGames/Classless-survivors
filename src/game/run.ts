import { updateStatuses } from './statuses';
import { updateMelee } from './melee';
import { STEP } from './rules';
import type { Point, Run } from './state';
import { updateCombatTimers, updateAttacks, updateProjectiles, applyContactDamage } from './combat';
import { updateSparks } from './effects';
import { movePlayer, moveEnemies } from './movement';
import { updatePickups } from './pickups';
import { updateSpawns } from './spawning';
import { getRunStats } from './stats';
import { beginEffectTick } from './events';
import { resolveTalentEffects } from './talent-effects';

/** One fixed tick. Order is deliberate: defeated enemies cannot damage the player. */
export function tickRun(run: Run, input: Point): void {
  if (run.status !== 'running') return;
  beginEffectTick(run.effects);
  const stats = getRunStats(run.progression.ranks);
  run.elapsed += STEP;
  updateCombatTimers(run.player);
  updateStatuses(run);
  updateSparks(run);
  movePlayer(run.player, input, stats.moveSpeed);
  updateSpawns(run);
  moveEnemies(run.enemies, run.player);
  updateAttacks(run, stats);
  updateProjectiles(run);
  resolveTalentEffects(run);
  updateMelee(run);
  resolveTalentEffects(run);
  updatePickups(run, stats.magnetRadius);
  // A level reward pauses the world before another enemy contact can occur.
  if (run.status === 'running') applyContactDamage(run);
  resolveTalentEffects(run);
}
