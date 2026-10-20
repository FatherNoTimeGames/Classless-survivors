import { updateEncounterSchedule, resolveBossDefeat, updateBossIntent } from './bosses';
import { updateBossDangers } from './boss-dangers';
import { checkDawn } from './run-ending';
import { updateDamageOverTime } from './damage-over-time';
import { updateSnares } from './snares';
import { updateCompanions } from './companions';
import { updateStatuses } from './statuses';
import { updateMelee } from './melee';
import { STEP } from './rules';
import type { Point, Run } from './state';
import { updateCombatTimers, updateAttacks, updateProjectiles, applyContactDamage } from './combat';
import { updateSparks } from './effects';
import { movePlayer } from './movement';
import { updateEnemies } from './enemies';
import { releaseEnemyAttacks, updateEnemyAttacks } from './enemy-attacks';
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
  updateDamageOverTime(run);
  resolveTalentEffects(run);
  resolveBossDefeat(run);
  updateEncounterSchedule(run);
  movePlayer(run.player, input, stats.moveSpeed);
  updateSpawns(run);
  updateSnares(run);
  updateEnemies(run);
  updateBossIntent(run);
  updateAttacks(run, stats);
  updateProjectiles(run);
  resolveTalentEffects(run);
  updateMelee(run);
  resolveTalentEffects(run);
  updateCompanions(run);
  resolveTalentEffects(run);
  resolveBossDefeat(run);
  resolveTalentEffects(run);
  if (checkDawn(run)) return;
  updatePickups(run, stats.magnetRadius);
  // A level reward pauses the world before another enemy contact can occur.
  if (run.status === 'running') {
    updateBossDangers(run);
    releaseEnemyAttacks(run);
    updateEnemyAttacks(run);
    applyContactDamage(run);
  }
  resolveTalentEffects(run);
}
