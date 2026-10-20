import { TALENTS } from '../../content/talents';
import type { TalentId } from '../../content/talents';
import type { Run } from '../state';
import { drainEffects } from '../events';
import type { EffectHandler } from '../events';
import { reprisal, spellsteel, ironWard, lastStand } from './warrior';
import { arcaneEcho, rimeSigil, chainSpark, shatterglass, manaWard, riftweaver } from './mage';
import { communion, searingGrace, sanctuary, atonementMark, atonementStrike, martyrWard, dawnChorus } from './priest';
import { soulCinder, detonation, soulLink, harvest } from './warlock';
import { huntingMomentum, snaringShot, frostTrap, wildHunt } from './hunter';
import { siphonToxin, contagion, nightfall } from './rogue';

export const TALENT_IMPLEMENTATIONS: Partial<Record<TalentId, readonly EffectHandler<Run>[]>> = {
  reprisal: [reprisal], 'arcane-echo': [arcaneEcho],
  // Timed cleaves live in melee.ts; Frostbreak modifies damage in statuses.ts.
  'sweeping-blade': [], frostbreak: [], spellsteel: [spellsteel],
  'iron-ward': [ironWard], 'last-stand': [lastStand],
  'rime-sigil': [rimeSigil], 'chain-spark': [chainSpark], shatterglass: [shatterglass],
  'mana-ward': [manaWard], riftweaver: [riftweaver],
  // Pre-damage and timed behaviors are registered here but live at shared boundaries.
  // Wound bonuses, Poison application, and critical rolls use hit-modifiers.ts.
  'expose-weakness': [], 'venom-edge': [], 'killer-instinct': [],
  'siphon-toxin': [siphonToxin], contagion: [contagion], nightfall: [nightfall],
  // Companion creation/ticks and Pack Link eligibility use their shared systems.
  falcon: [], 'pack-link': [], snare: [snaringShot], 'frost-trap': [frostTrap], 'wild-hunt': [wildHunt],
  communion: [communion], 'searing-grace': [searingGrace],
  sanctuary: [sanctuary], atonement: [atonementMark, atonementStrike],
  'martyr-ward': [martyrWard], 'dawn-chorus': [dawnChorus],
  // Agony is an on-hit modifier; Grim Pact creates a companion during state construction.
  agony: [], 'grim-pact': [], detonation: [detonation], 'soul-link': [soulLink], harvest: [harvest],
  'soul-cinder': [soulCinder], 'hunting-momentum': [huntingMomentum],
};

export function resolveTalentEffects(run: Run): void {
  if (run.status === 'defeated') { run.effects.pending = []; return; }
  // Catalog order makes interactions independent of the order points were allocated.
  const handlers = TALENTS.filter((talent) => run.talents.includes(talent.id))
    .flatMap((talent) => TALENT_IMPLEMENTATIONS[talent.id] ?? []);
  drainEffects(run.effects, run, handlers);
  run.enemies = run.enemies.filter((enemy) => enemy.health > 0);
}
