import type { EffectHandler } from '../events';
import type { Run } from '../state';
import { TALENT_TUNING as T } from '../../content/talent-tuning';
import { inheritsOnHit } from '../hit-policy';
import { placeSnare } from '../snares';
import { distance } from '../geometry';
import { addSpark } from '../effects';
import { commandCompanions } from '../companions';

export const huntingMomentum: EffectHandler<Run> = {
  id: 'hunting-momentum', on: 'kill',
  apply(run) { run.talentMemory.huntingCharge = true; },
};

export const snaringShot: EffectHandler<Run> = {
  id: 'snare', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || !inheritsOnHit(run, event.source)) return;
    if (++run.talentMemory.snareHits < T.snareHits) return;
    run.talentMemory.snareHits = 0;
    placeSnare(run, event.position);
  },
};

export const frostTrap: EffectHandler<Run> = {
  id: 'frost-trap', on: 'hit',
  apply(run, event) {
    if (event.type !== 'hit' || !inheritsOnHit(run, event.source)) return;
    const target = run.enemies.find((enemy) => enemy.health > 0 && enemy.id === event.targetId);
    if (!target || target.rootImmune > 0) return;
    const slowed = event.slowed || target.frost > 0 || target.snared || run.snares.some((snare) => distance(target, snare) <= snare.radius);
    if (!slowed) return;
    target.root = T.rootDuration;
    target.rootImmune = T.rootCooldown;
    target.frost = Math.max(target.frost, T.frostDuration);
    addSpark(run, target, 'root');
  },
};

export const wildHunt: EffectHandler<Run> = {
  id: 'wild-hunt', on: 'momentum-spent',
  apply(run) {
    if (run.talentMemory.wildHuntIn > 0) return;
    run.talentMemory.wildHuntIn = T.wildHuntCooldown;
    commandCompanions(run);
  },
};
