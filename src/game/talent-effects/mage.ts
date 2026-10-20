import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { damageEnemy } from '../damage';
import { nearestEnemy } from '../targeting';
import { addSpark } from '../effects';

export const arcaneEcho: EffectHandler<Run> = {
  id: 'arcane-echo', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || event.source !== 'ember') return;
    run.talentMemory.arcaneHits++;
    if (run.talentMemory.arcaneHits < T.echoHits) return;
    run.talentMemory.arcaneHits = 0;
    const target = nearestEnemy(run.enemies, event.position, T.echoRange, event.targetId);
    if (target) {
      addSpark(run, target, 'arcane');
      damageEnemy(run, target, T.echoDamage, { source: 'talent', school: 'arcane' });
    }
  },
};
