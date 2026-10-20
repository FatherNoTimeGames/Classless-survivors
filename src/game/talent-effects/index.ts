import type { TalentId } from '../../content/talents';
import type { Run } from '../state';
import { drainEffects } from '../events';
import type { EffectHandler } from '../events';
import { reprisal, spellsteel, ironWard, lastStand } from './warrior';
import { arcaneEcho, rimeSigil, chainSpark, shatterglass, manaWard, riftweaver } from './mage';
import { communion, searingGrace } from './priest';
import { soulCinder } from './warlock';
import { huntingMomentum } from './hunter';

export const TALENT_IMPLEMENTATIONS: Partial<Record<TalentId, readonly EffectHandler<Run>[]>> = {
  reprisal: [reprisal], 'arcane-echo': [arcaneEcho],
  // Timed cleaves live in melee.ts; Frostbreak modifies damage in statuses.ts.
  'sweeping-blade': [], frostbreak: [], spellsteel: [spellsteel],
  'iron-ward': [ironWard], 'last-stand': [lastStand],
  'rime-sigil': [rimeSigil], 'chain-spark': [chainSpark], shatterglass: [shatterglass],
  'mana-ward': [manaWard], riftweaver: [riftweaver],
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
