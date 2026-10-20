import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { distance } from '../geometry';
import { addSpark } from '../effects';
import { fireVolley } from '../projectiles';
import { inheritsOnHit } from '../hit-policy';
import { grantShield } from '../shields';

export const reprisal: EffectHandler<Run> = {
  id: 'reprisal', on: 'hurt',
  apply(run, event) {
    addSpark(run, event.position, 'physical', T.reprisalRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.reprisalRange) damageEnemy(run, enemy, T.reprisalDamage, { source: 'talent', school: 'physical' });
    }
  },
};

export const spellsteel: EffectHandler<Run> = {
  id: 'spellsteel', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || event.school !== 'physical' || !inheritsOnHit(run, event.source)) return;
    run.talentMemory.physicalHits = Math.min(T.spellsteelHits, run.talentMemory.physicalHits + 1);
    if (run.talentMemory.physicalHits < T.spellsteelHits || run.talentMemory.spellsteelIn > 0) return;
    const fired = fireVolley(run, event.position, event.position, T.spellsteelRange, {
      damage: T.spellsteelDamage, source: 'talent', school: 'fire', excludeId: event.targetId,
    });
    if (fired) {
      run.talentMemory.physicalHits = 0;
      run.talentMemory.spellsteelIn = T.spellsteelCooldown;
    }
  },
};

export const ironWard: EffectHandler<Run> = {
  id: 'iron-ward', on: 'hurt',
  apply(run) {
    if (run.talentMemory.ironWardIn > 0) return;
    grantShield(run, T.wardAmount, T.wardDuration);
    run.talentMemory.ironWardIn = T.ironWardCooldown;
  },
};

export const lastStand: EffectHandler<Run> = {
  id: 'last-stand', on: 'shield-broken',
  apply(run, event) {
    addSpark(run, event.position, 'physical', T.lastStandRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.lastStandRange) damageEnemy(run, enemy, T.lastStandDamage, { source: 'talent', school: 'physical' });
    }
  },
};
