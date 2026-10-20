import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { distance } from '../geometry';
import { addSpark } from '../effects';
import { healPlayer } from '../healing';
import { remainingDotDamage } from '../dot-state';

export const soulCinder: EffectHandler<Run> = {
  id: 'soul-cinder', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill') return;
    run.talentMemory.cinderKills++;
    if (run.talentMemory.cinderKills < T.cinderKills) return;
    run.talentMemory.cinderKills = 0;
    addSpark(run, event.position, 'shadow', T.cinderRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.cinderRange) damageEnemy(run, enemy, T.cinderDamage, { source: 'talent', school: 'shadow' });
    }
  },
};

export const detonation: EffectHandler<Run> = {
  id: 'detonation', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill') return;
    const damage = Math.min(T.detonationCap, (event.dots ?? []).reduce((sum, dot) => sum + remainingDotDamage(dot), 0));
    if (damage <= 0) return;
    addSpark(run, event.position, 'detonation', T.detonationRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.detonationRange) damageEnemy(run, enemy, damage, { source: 'talent', school: 'shadow' });
    }
  },
};

export const soulLink: EffectHandler<Run> = {
  id: 'soul-link', on: 'healed',
  apply(run, event) {
    for (const companion of run.companions) {
      companion.bonusDamage = Math.min(T.soulLinkCap, companion.bonusDamage + event.amount * T.soulLinkFraction);
    }
  },
};

export const harvest: EffectHandler<Run> = {
  id: 'harvest', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill' || event.source !== 'dot') return;
    healPlayer(run, T.harvestHeal);
    const target = run.enemies.filter((enemy) => enemy.health > 0 && enemy.dots.some((dot) => dot.remaining > 0)
      && distance(enemy, event.position) <= T.harvestRange)
      .sort((a, b) => distance(a, event.position) - distance(b, event.position) || a.id - b.id)[0];
    const effect = target?.dots.filter((dot) => dot.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining || a.kind.localeCompare(b.kind))[0];
    if (effect) effect.remaining = Math.max(effect.remaining, Math.min(T.harvestDurationCap, effect.remaining + T.harvestExtension));
  },
};
