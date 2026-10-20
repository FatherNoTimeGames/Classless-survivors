import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { healPlayer } from '../healing';
import { applyDot } from '../dot-state';
import { pulseDots } from '../damage-over-time';
import { distance } from '../geometry';
import { addSpark } from '../effects';

export const siphonToxin: EffectHandler<Run> = {
  id: 'siphon-toxin', on: 'dot-expired',
  apply(run) { healPlayer(run, T.siphonHeal); },
};

export const contagion: EffectHandler<Run> = {
  id: 'contagion', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || !event.critical || !event.dots?.length) return;
    const targets = run.enemies.filter((enemy) => enemy.health > 0 && enemy.id !== event.targetId
      && distance(enemy, event.position) <= T.contagionRange)
      .sort((a, b) => distance(a, event.position) - distance(b, event.position) || a.id - b.id)
      .slice(0, T.contagionTargets);
    for (const target of targets) {
      for (const dot of event.dots) applyDot(target, dot);
      addSpark(run, target, 'poison');
    }
  },
};

export const nightfall: EffectHandler<Run> = {
  id: 'nightfall', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill' || !event.critical) return;
    for (const enemy of run.enemies) {
      if (enemy.health > 0 && distance(enemy, event.position) <= T.nightfallRange) pulseDots(run, enemy);
    }
  },
};
