import type { Run } from './state';
import type { DamageSource } from './events';

/** Weapon, area, spell, and retaliation hits share rules. Periodic ticks cannot reapply themselves. */
export function inheritsOnHit(run: Run, source: DamageSource): boolean {
  return source !== 'dot' && (source !== 'summon' || run.talents.includes('pack-link'));
}
