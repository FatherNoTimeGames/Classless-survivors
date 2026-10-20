import type { DamageSource } from '../events';
import type { Enemy, Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';

/** A pre-damage modifier, rather than a post-hit trigger. */
export function modifyDirectDamage(run: Run, enemy: Enemy, amount: number, source: DamageSource): number {
  if (source !== 'ember' || enemy.health >= enemy.maxHealth || !run.talents.includes('expose-weakness')) return amount;
  // The refund matters even when a wounded starter enemy would die to the base hit.
  run.player.attackIn = Math.max(0, run.player.attackIn - T.exposedRefund);
  return amount + T.exposedDamage;
}
