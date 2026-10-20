import { STEP } from './rules';
import type { Point, Run } from './state';
import { updateCombatTimers, updateAttacks, updateProjectiles, applyContactDamage } from './combat';
import { updateSparks } from './effects';
import { movePlayer, moveEnemies } from './movement';
import { updatePickups } from './pickups';
import { updateSpawns } from './spawning';

/** One fixed tick. Order is deliberate: defeated enemies cannot damage the player. */
export function tickRun(run: Run, input: Point): void {
  if (run.status !== 'running') return;
  run.elapsed += STEP;
  updateCombatTimers(run.player);
  updateSparks(run);
  movePlayer(run.player, input);
  updateSpawns(run);
  moveEnemies(run.enemies, run.player);
  updateAttacks(run);
  updateProjectiles(run);
  updatePickups(run);
  applyContactDamage(run);
}
