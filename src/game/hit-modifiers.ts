import { upgradeRank } from '../content/upgrades';
import { UPGRADE_TUNING as U } from '../content/upgrade-tuning';
import type { Enemy, Run } from './state';
import type { DamageSource } from './events';
import { TALENT_TUNING as T } from '../content/talent-tuning';
import { inheritsOnHit } from './hit-policy';
import { applyDot } from './dot-state';
import { refundAttacks } from './attack-timing';

/** Pre-damage modifiers have no damage/effect-handler imports, avoiding proc cycles. */
export function prepareHit(run: Run, enemy: Enemy, amount: number, source: DamageSource) {
  const potency = upgradeRank(run.progression.ranks, 'potency') * U.periodicDamage;
  const venom = upgradeRank(run.progression.ranks, 'venom');
  if (inheritsOnHit(run, source)) {
    if (enemy.health < enemy.maxHealth && run.talents.includes('expose-weakness')) {
      amount += T.exposedDamage;
      refundAttacks(run, T.exposedRefund);
    }
    if (run.talents.includes('agony')) applyDot(enemy, {
      kind: 'curse', school: 'shadow', owner: source === 'summon' ? 'companion' : 'player',
      damage: T.curseDamage + potency, interval: T.dotInterval, remaining: T.curseDuration, tickIn: T.dotInterval,
    });
  }
  // Viper Ink explicitly supplies companion on-hit Poison even without Pack Link.
  const poisonTalent = run.talents.includes('venom-edge');
  if (source !== 'dot' && (venom > 0 || (poisonTalent && inheritsOnHit(run, source)))) applyDot(enemy, {
    kind: 'poison', school: 'poison', owner: source === 'summon' ? 'companion' : 'player',
    damage: (poisonTalent ? T.poisonDamage : 1) + venom * U.venomDamage + potency,
    interval: T.dotInterval, remaining: T.poisonDuration, tickIn: T.dotInterval,
  });
  let critical = false;
  const precision = upgradeRank(run.progression.ranks, 'precision');
  if (source !== 'dot' && (precision > 0 || run.talents.includes('killer-instinct'))) {
    run.talentMemory.criticalHits++;
    if (run.talentMemory.criticalHits >= (run.talents.includes('killer-instinct') ? T.criticalEvery : 6) - precision) {
      run.talentMemory.criticalHits = 0;
      critical = true;
    }
  }
  return { amount, critical, multiplier: critical ? T.criticalMultiplier : 1 };
}
