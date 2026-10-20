import { STEP } from './rules';
import type { Point, Run } from './state';
import { updateCombatTimers, updateAttacks, updateProjectiles, applyContactDamage } from './combat';
import { updateSparks } from './effects';
import { movePlayer, moveEnemies } from './movement';
import { updatePickups } from './pickups';
import { updateSpawns } from './spawning';
import { getRunStats } from './stats';

/** One fixed tick. Order is deliberate: defeated enemies cannot damage the player. */
export function tickRun(run: Run, input: Point): void {
  if (run.status !== 'running') return;
  const stats = getRunStats(run.progression.ranks);
  run.elapsed += STEP;
  updateCombatTimers(run.player);
  updateSparks(run);
  movePlayer(run.player, input, stats.moveSpeed);
  updateSpawns(run);
  moveEnemies(run.enemies, run.player);
  updateAttacks(run, stats);
  updateProjectiles(run);
  updatePickups(run, stats.magnetRadius);
  // A level reward pauses the world before another enemy contact can occur.
  if (run.status === 'running') applyContactDamage(run);
}
