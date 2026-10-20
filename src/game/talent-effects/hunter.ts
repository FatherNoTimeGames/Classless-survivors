import type { EffectHandler } from '../events';
import type { Run } from '../state';

export const huntingMomentum: EffectHandler<Run> = {
  id: 'hunting-momentum', on: 'kill',
  apply(run, event) {
    if (event.type === 'kill' && event.source === 'ember') run.talentMemory.huntingCharge = true;
  },
};
