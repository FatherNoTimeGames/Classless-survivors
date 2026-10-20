import type { Enemy, Run } from './state';
import type { DamageSource } from './events';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { inheritsOnHit } from './hit-policy';
import { applyDot } from './dot-state';
import { refundAttacks } from './attack-timing';

/** Pre-damage modifiers have no damage/effect-handler imports, avoiding proc cycles. */
export function prepareHit(run: Run, enemy: Enemy, amount: number, source: DamageSource) {
  if (inheritsOnHit(run, source)) {
    if (enemy.health < enemy.maxHealth && run.talents.includes('expose-weakness')) {
      amount += T.exposedDamage;
      refundAttacks(run, T.exposedRefund);
    }
    if (run.talents.includes('agony')) applyDot(enemy, {
      kind: 'curse', school: 'shadow', owner: source === 'summon' ? 'companion' : 'player',
      damage: T.curseDamage, interval: T.dotInterval, remaining: T.curseDuration, tickIn: T.dotInterval,
    });
    if (run.talents.includes('venom-edge')) applyDot(enemy, {
      kind: 'poison', school: 'poison', owner: source === 'summon' ? 'companion' : 'player',
      damage: T.poisonDamage, interval: T.dotInterval, remaining: T.poisonDuration, tickIn: T.dotInterval,
    });
  }
  let critical = false;
  if (source !== 'dot' && run.talents.includes('killer-instinct')) {
    run.talentMemory.criticalHits++;
    if (run.talentMemory.criticalHits >= T.criticalEvery) {
      run.talentMemory.criticalHits = 0;
      critical = true;
    }
  }
  return { amount, critical, multiplier: critical ? T.criticalMultiplier : 1 };
}
