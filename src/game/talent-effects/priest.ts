import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { healPlayer } from '../healing';
import { nearestEnemy } from '../targeting';
import { damageEnemy } from '../damage';
import { addSpark } from '../effects';
import { addShield } from '../shields';

export const communion: EffectHandler<Run> = {
  id: 'communion', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill') return;
    run.talentMemory.communionKills++;
    if (run.talentMemory.communionKills < T.communionKills) return;
    run.talentMemory.communionKills = 0;
    healPlayer(run, T.communionHeal);
  },
};

export const sanctuary: EffectHandler<Run> = {
  id: 'sanctuary', on: 'pickup',
  apply(run) {
    if (run.talentMemory.sanctuaryIn > 0) return;
    run.talentMemory.sanctuaryIn = T.sanctuaryCooldown;
    healPlayer(run, T.sanctuaryHeal);
  },
};

export const atonementMark: EffectHandler<Run> = {
  id: 'atonement', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || event.school !== 'holy' || event.source === 'dot') return;
    const target = run.enemies.find((enemy) => enemy.id === event.targetId && enemy.health > 0);
    if (target) {
      target.holyMark = T.markDuration;
      addSpark(run, target, 'mark');
    }
  },
};

export const atonementStrike: EffectHandler<Run> = {
  // Share the talent ID so this holy strike cannot reapply its own consumed mark.
  id: 'atonement', on: 'mark-consumed',
  apply(run, event) {
    if (event.type !== 'mark-consumed') return;
    const target = run.enemies.find((enemy) => enemy.id === event.targetId && enemy.health > 0);
    if (target) {
      addSpark(run, target, 'atonement');
      damageEnemy(run, target, T.atonementDamage, { source: 'talent', school: 'holy' });
    }
  },
};

export const martyrWard: EffectHandler<Run> = {
  id: 'martyr-ward', on: 'overhealed',
  apply(run, event) {
    addShield(run, event.amount * T.martyrFraction, T.martyrCap, T.martyrDuration);
  },
};

export const dawnChorus: EffectHandler<Run> = {
  id: 'dawn-chorus', on: 'absorbed',
  apply(run, event) {
    if (run.talentMemory.dawnIn > 0) return;
    run.talentMemory.dawnIn = T.dawnCooldown;
    healPlayer(run, T.dawnHeal);
    const target = nearestEnemy(run.enemies, event.position, T.dawnRange);
    if (target) {
      addSpark(run, target, 'holy');
      damageEnemy(run, target, T.dawnDamage, { source: 'talent', school: 'holy' });
    }
  },
};

export const searingGrace: EffectHandler<Run> = {
  id: 'searing-grace', on: 'healed',
  apply(run, event) {
    const target = nearestEnemy(run.enemies, event.position, T.graceRange);
    if (target) {
      addSpark(run, target, 'holy');
      damageEnemy(run, target, T.graceDamage, { source: 'talent', school: 'holy' });
    }
  },
};
