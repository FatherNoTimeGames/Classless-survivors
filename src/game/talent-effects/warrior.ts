import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { distance } from '../geometry';
import { addSpark } from '../effects';

export const reprisal: EffectHandler<Run> = {
  id: 'reprisal', on: 'hurt',
  apply(run, event) {
    addSpark(run, event.position, 'physical', T.reprisalRange);
    for (const enemy of run.enemies) {
      if (distance(enemy, event.position) <= T.reprisalRange) damageEnemy(run, enemy, T.reprisalDamage, { source: 'talent', school: 'physical' });
    }
  },
};
