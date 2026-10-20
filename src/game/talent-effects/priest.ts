import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { healPlayer } from '../healing';
import { nearestEnemy } from '../targeting';
import { damageEnemy } from '../damage';
import { addSpark } from '../effects';

export const communion: EffectHandler<Run> = {
  id: 'communion', on: 'kill',
  apply(run, event) {
    if (event.type !== 'kill' || event.source !== 'ember') return;
    run.talentMemory.communionKills++;
    if (run.talentMemory.communionKills < T.communionKills) return;
    run.talentMemory.communionKills = 0;
    healPlayer(run, T.communionHeal);
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
