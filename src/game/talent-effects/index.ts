import type { TalentId } from '../../content/talents';
import type { Run } from '../state';
import { drainEffects } from '../events';
import type { EffectHandler } from '../events';
import { reprisal } from './warrior';
import { arcaneEcho } from './mage';
import { communion, searingGrace } from './priest';
import { soulCinder } from './warlock';
import { huntingMomentum } from './hunter';

export const TALENT_IMPLEMENTATIONS: Partial<Record<TalentId, readonly EffectHandler<Run>[]>> = {
  reprisal: [reprisal], 'arcane-echo': [arcaneEcho],
  // Expose Weakness is applied before damage in rogue.ts, not by an event handler.
  'expose-weakness': [], communion: [communion], 'searing-grace': [searingGrace],
  'soul-cinder': [soulCinder], 'hunting-momentum': [huntingMomentum],
};

export function resolveTalentEffects(run: Run): void {
  if (run.status === 'defeated') { run.effects.pending = []; return; }
  const handlers = run.talents.flatMap((id) => TALENT_IMPLEMENTATIONS[id] ?? []);
  drainEffects(run.effects, run, handlers);
  run.enemies = run.enemies.filter((enemy) => enemy.health > 0);
}
