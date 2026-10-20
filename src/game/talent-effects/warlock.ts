import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { distance } from '../geometry';
import { addSpark } from '../effects';

export const soulCinder: EffectHandler<Run> = {
  id: 'soul-cinder', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill' || event.source !== 'ember') return;
    run.talentMemory.cinderKills++;
    if (run.talentMemory.cinderKills < T.cinderKills) return;
    run.talentMemory.cinderKills = 0;
    addSpark(run, event.position, 'shadow', T.cinderRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.cinderRange) damageEnemy(run, enemy, T.cinderDamage, { source: 'talent', school: 'shadow' });
    }
  },
};
