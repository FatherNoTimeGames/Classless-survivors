import type { Enemy, Run } from './state';
import { addSpark } from './effects';
import { dropShard } from './pickups';
import { RULES } from './rules';
import { emitEffect } from './events';
import type { DamageSchool, DamageSource } from './events';
import { modifyDirectDamage } from './talent-effects/rogue';

/** Shared damage boundary: deaths and XP drops are credited exactly once. */
export function damageEnemy(run: Run, enemy: Enemy, amount: number, options: { source?: DamageSource; school?: DamageSchool } = {}): void {
  if (enemy.health <= 0 || !Number.isFinite(amount) || amount <= 0) return;
  const source = options.source ?? 'ember';
  const school = options.school ?? 'fire';
  const actual = Math.min(enemy.health, modifyDirectDamage(run, enemy, amount, source));
  enemy.health -= actual;
  addSpark(run, enemy, 'hit');
  const payload = { targetId: enemy.id, amount: actual, source, school, position: { x: enemy.x, y: enemy.y } };
  emitEffect(run.effects, { type: 'hit', ...payload });
  if (enemy.health <= 0) {
    run.kills++;
    dropShard(run, enemy);
    emitEffect(run.effects, { type: 'kill', ...payload });
  }
}

export function damagePlayer(run: Run, amount: number): void {
  if (run.status !== 'running' || run.player.invulnerable > 0 || !Number.isFinite(amount) || amount <= 0) return;
  const actual = Math.min(run.player.health, amount);
  run.player.health -= actual;
  run.player.invulnerable = RULES.invulnerability;
  addSpark(run, run.player, 'hurt');
  emitEffect(run.effects, { type: 'hurt', amount: actual, position: { x: run.player.x, y: run.player.y } });
  if (run.player.health === 0) run.status = 'defeated';
}
