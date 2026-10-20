import type { Enemy, Run } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { STEP } from './rules';
import { emitEffect } from './events';
import type { DamageSource, DamageSchool } from './events';
import { addSpark } from './effects';

export function updateStatuses(run: Run): void {
  for (const enemy of run.enemies) {
    enemy.frost = Math.max(0, enemy.frost - STEP);
    enemy.stun = Math.max(0, enemy.stun - STEP);
  }
  const shield = run.player.shield;
  shield.remaining = Math.max(0, shield.remaining - STEP);
  if (shield.remaining === 0) shield.amount = 0;
  run.player.meleeIn = Math.max(0, run.player.meleeIn - STEP);
  run.talentMemory.ironWardIn = Math.max(0, run.talentMemory.ironWardIn - STEP);
  run.talentMemory.riftIn = Math.max(0, run.talentMemory.riftIn - STEP);
}

/** Snapshot consumption before damage so lethal hits and both Frost talents agree. */
export function consumeFrost(run: Run, enemy: Enemy, source: DamageSource, school: DamageSchool): number {
  if (school !== 'physical' || enemy.frost <= 0) return 0;
  const frostbreak = source === 'melee' && run.talents.includes('frostbreak');
  if (!frostbreak && !run.talents.includes('shatterglass')) return 0;
  enemy.frost = 0;
  if (frostbreak) enemy.stun = Math.max(enemy.stun, T.frostbreakStun);
  addSpark(run, enemy, 'frost', T.shatterRange);
  emitEffect(run.effects, { type: 'frost-consumed', targetId: enemy.id, amount: 0, position: { x: enemy.x, y: enemy.y } });
  return frostbreak ? T.frostbreakDamage : 0;
}
