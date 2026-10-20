import type { Enemy, Run } from './state';
import type { DamageSchool, DamageSource } from './events';
import { emitEffect } from './events';
import { TALENT_TUNING as T } from '../content/talent-tuning';

/** Both melee and physical companion/retaliation hits can consume a holy mark. */
export function consumeHolyMark(run: Run, enemy: Enemy, source: DamageSource, school: DamageSchool): void {
  if (!run.talents.includes('atonement') || source === 'dot' || school !== 'physical' || enemy.holyMark <= 0) return;
  enemy.holyMark = 0;
  emitEffect(run.effects, { type: 'mark-consumed', targetId: enemy.id, amount: T.atonementDamage, position: { x: enemy.x, y: enemy.y } });
}
