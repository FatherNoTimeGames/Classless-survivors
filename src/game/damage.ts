import type { Enemy, Run } from './state';
import { completeRun } from './run-ending';
import { addSpark } from './effects';
import { dropShard } from './pickups';
import { RULES } from './rules';
import { emitEffect } from './events';
import type { DamageSchool, DamageSource } from './events';
import { prepareHit } from './hit-modifiers';
import { snapshotDots } from './dot-state';
import { consumeFrost } from './statuses';
import { absorbDamage } from './shields';
import { consumeHolyMark } from './marks';

/** Shared damage boundary: deaths and XP drops are credited exactly once. */
export function damageEnemy(run: Run, enemy: Enemy, amount: number, options: { source?: DamageSource; school?: DamageSchool } = {}): void {
  if (run.status === 'victory' || run.status === 'defeated' || enemy.health <= 0 || !Number.isFinite(amount) || amount <= 0) return;
  const source = options.source ?? 'ember';
  const school = options.school ?? 'fire';
  // Physical effects may consume Frost before post-hit handlers inspect the victim.
  const slowed = enemy.frost > 0 || enemy.snared;
  const hit = prepareHit(run, enemy, amount, source);
  consumeHolyMark(run, enemy, source, school);
  const actual = Math.min(enemy.health, (hit.amount + consumeFrost(run, enemy, source, school)) * hit.multiplier);
  enemy.health -= actual;
  addSpark(run, enemy, hit.critical ? 'critical' : 'hit');
  const payload = { targetId: enemy.id, amount: actual, source, school, critical: hit.critical, slowed, dots: snapshotDots(enemy), position: { x: enemy.x, y: enemy.y } };
  emitEffect(run.effects, { type: 'hit', ...payload });
  if (enemy.health <= 0) {
    run.kills++;
    dropShard(run, enemy, enemy.rewardXp);
    emitEffect(run.effects, { type: 'kill', ...payload });
  }
}

export function damagePlayer(run: Run, amount: number): void {
  if (run.status !== 'running' || run.player.invulnerable > 0 || !Number.isFinite(amount) || amount <= 0) return;
  const actual = Math.min(run.player.health, absorbDamage(run, amount));
  run.player.health -= actual;
  run.player.invulnerable = RULES.invulnerability;
  addSpark(run, run.player, 'hurt');
  if (actual > 0) emitEffect(run.effects, { type: 'hurt', amount: actual, position: { x: run.player.x, y: run.player.y } });
  if (run.player.health === 0) completeRun(run, 'defeated', 'slain');
}
