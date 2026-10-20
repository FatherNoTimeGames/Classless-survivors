import { createCompanions } from './companion-state';
import type { CompanionKind } from '../content/companions';
import type { DamageOverTime } from './dot-state';
import { RULES, WORLD } from './rules';
import type { UpgradeId, UpgradeRanks } from '../content/upgrades';
import type { TalentId } from '../content/talents';
import { validateBuild } from './builds';
import { createEffectQueue } from './events';
import type { DamageSchool, DamageSource, EffectQueue } from './events';

export interface Point { x: number; y: number }
export interface Player extends Point {
  health: number;
  invulnerable: number;
  attackIn: number;
  facing: number;
  moving: boolean;
  meleeIn: number;
  shield: { amount: number; remaining: number };
}
export interface Enemy extends Point {
  id: number; health: number; maxHealth: number; grace: number;
  holyMark: number; frost: number; stun: number; root: number; rootImmune: number; snared: boolean;
  dots: DamageOverTime[];
}
export interface Companion extends Point { id: number; kind: CompanionKind; attackIn: number; targetId: number | null; bonusDamage: number }
export interface Snare extends Point { id: number; remaining: number; radius: number }
export interface Bolt extends Point {
  id: number; vx: number; vy: number; life: number;
  source: DamageSource; school: DamageSchool;
  damage: number; pierce: number; blastRadius: number; hitIds: number[];
}
export interface Shard extends Point { id: number; value: number }
export interface Spark extends Point { kind: 'hit' | 'pickup' | 'hurt' | 'burst' | 'heal' | 'physical' | 'arcane' | 'holy' | 'shadow' | 'cleave' | 'frost' | 'lightning' | 'shield' | 'critical' | 'poison' | 'root' | 'falcon' | 'curse' | 'detonation' | 'mark' | 'atonement' | 'imp'; life: number; radius?: number; angle?: number }
export interface Progression {
  level: number;
  xpIntoLevel: number;
  pendingLevels: number;
  offers: UpgradeId[];
  ranks: UpgradeRanks;
  randomState: number;
}
export interface Run {
  status: 'running' | 'choosing' | 'defeated';
  elapsed: number;
  kills: number;
  xp: number;
  progression: Progression;
  talents: readonly TalentId[];
  talentMemory: {
    arcaneHits: number; communionKills: number; cinderKills: number; huntingCharge: boolean;
    meleeHits: number; chainHits: number; spellHits: number; ironWardIn: number; riftIn: number;
    criticalHits: number; snareHits: number; wildHuntIn: number; sanctuaryIn: number; dawnIn: number;
  };
  effects: EffectQueue;
  player: Player;
  enemies: Enemy[];
  bolts: Bolt[];
  companions: Companion[];
  snares: Snare[];
  shards: Shard[];
  sparks: Spark[];
  spawnIn: number;
  randomState: number;
  nextId: number;
}

export function createRun(seed: number, talents: readonly TalentId[] = []): Run {
  const validation = validateBuild(talents);
  if (!validation.valid) throw new Error(`Invalid talent build: ${validation.errors.join(' ')}`);
  return {
    status: 'running', elapsed: 0, kills: 0, xp: 0,
    talents: [...talents], effects: createEffectQueue(),
    talentMemory: { arcaneHits: 0, communionKills: 0, cinderKills: 0, huntingCharge: false, meleeHits: 0, chainHits: 0, spellHits: 0, ironWardIn: 0, riftIn: 0, criticalHits: 0, snareHits: 0, wildHuntIn: 0, sanctuaryIn: 0, dawnIn: 0 },
    progression: {
      level: 1, xpIntoLevel: 0, pendingLevels: 0, offers: [], ranks: {},
      randomState: ((seed ^ 0xa5a5a5a5) >>> 0) || 0x9e3779b9,
    },
    player: {
      x: WORLD.width / 2, y: WORLD.height / 2, health: RULES.maxHealth,
      invulnerable: 0, attackIn: 0, facing: 1, moving: false, meleeIn: 0, shield: { amount: 0, remaining: 0 },
    },
    enemies: [], bolts: [], snares: [],
    companions: createCompanions(talents, { x: WORLD.width / 2, y: WORLD.height / 2 }),
    shards: [], sparks: [],
    spawnIn: RULES.firstSpawnDelay, randomState: (seed >>> 0) || 0x9e3779b9, nextId: 1,
  };
}
