const MAX_RUN_LEVEL = 40;

/** Run-only content. Add/tune offers here; selection and combat stay generic. */
export type UpgradeId = 'haste' | 'fork' | 'pierce' | 'burst' | 'fleet' | 'magnet' | 'vitality' | 'longblade' | 'potency' | 'familiar' | 'wellspring' | 'aegis' | 'precision' | 'icebrand' | 'riposte' | 'catalyst' | 'benediction' | 'frost-pact' | 'venom' | 'recovery';
export type UpgradeRanks = Partial<Record<UpgradeId, number>>;
export type Rarity = 'common' | 'uncommon' | 'rare';
export interface UpgradeBonuses {
  attackInterval?: number;
  projectileCount?: number;
  pierce?: number;
  blastRadius?: number;
  moveSpeed?: number;
  magnetRadius?: number;
  maxHealth?: number;
}
export type UpgradeCapability = 'melee' | 'physical' | 'periodic' | 'companion' | 'healing' | 'shield' | 'critical' | 'slow';
export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  rarity: Rarity;
  minLevel: number;
  maxRank: number;
  category: 'weapon' | 'survival' | 'utility';
  bonuses: UpgradeBonuses;
  needs?: readonly UpgradeCapability[];
  fallback?: boolean;
}

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: 'haste', name: 'Quickened Ember', rarity: 'common', minLevel: 2, maxRank: 4, category: 'weapon',
    description: 'Reduce ember cooldown by 0.08 seconds; melee and companion attack intervals shorten by the same proportion. Does not speed periodic ticks or talent cooldowns.', bonuses: { attackInterval: -0.08 } },
  { id: 'fleet', name: 'Fleetfoot', rarity: 'common', minLevel: 2, maxRank: 3, category: 'survival',
    description: 'Move faster: +12 movement speed.', bonuses: { moveSpeed: 12 } },
  { id: 'magnet', name: 'Soul Gatherer', rarity: 'common', minLevel: 2, maxRank: 3, category: 'utility',
    description: 'Attract XP shards from farther away: +18 pickup attraction range.', bonuses: { magnetRadius: 18 } },
  { id: 'vitality', name: 'Living Ember', rarity: 'common', minLevel: 2, maxRank: 3, category: 'survival',
    description: 'Gain 12 maximum health and restore 12 health.', bonuses: { maxHealth: 12 } },
  { id: 'fork', name: 'Forked Ember', rarity: 'uncommon', minLevel: 3, maxRank: 2, category: 'weapon',
    description: 'Each ember, Spellsteel, and imp volley fires at one additional distinct nearby foe, when available. Does not add melee or falcon strikes.', bonuses: { projectileCount: 1 } },
  { id: 'pierce', name: 'Soul Needle', rarity: 'uncommon', minLevel: 3, maxRank: 2, category: 'weapon',
    description: 'Ember, Spellsteel, and imp projectiles pass through one additional enemy.', bonuses: { pierce: 1 } },
  { id: 'burst', name: 'Ashburst', rarity: 'rare', minLevel: 4, maxRank: 2, category: 'weapon',
    description: 'Ember, Spellsteel, and imp projectile impacts explode for half their shot damage. Each rank adds 20 blast range. Explosions retain ownership and cannot chain.', bonuses: { blastRadius: 20 } },
  { id: 'longblade', name: 'Grave Longblade', rarity: 'common', minLevel: 5, maxRank: 2, category: 'weapon', needs: ['melee'],
    description: 'Sweeping Blade gains 14 range and 4 base damage per rank. Its longer reach carries your physical, Frost and on-hit interactions.', bonuses: {} },
  { id: 'potency', name: 'Lingering Venom', rarity: 'common', minLevel: 5, maxRank: 3, category: 'weapon', needs: ['periodic'],
    description: 'New or refreshed Poison and curses deal 2 more damage per tick per rank. Tick timing stays unchanged; companion effects and propagated snapshots retain the bonus.', bonuses: {} },
  { id: 'familiar', name: 'Empowered Familiars', rarity: 'common', minLevel: 5, maxRank: 2, category: 'weapon', needs: ['companion'],
    description: 'Falcon and imp attacks gain 4 base damage and 20 targeting range per rank. Imp volleys snapshot this damage; talent inheritance still follows Pack Link.', bonuses: {} },
  { id: 'wellspring', name: 'Blood Wellspring', rarity: 'common', minLevel: 5, maxRank: 1, category: 'survival',
    description: 'Every 6 kills, from any source, attempt 4 healing. Actual healing feeds healing effects; excess healing can feed Martyr Ward.', bonuses: {} },
  { id: 'aegis', name: 'Returning Aegis', rarity: 'common', minLevel: 5, maxRank: 2, category: 'survival',
    description: 'While foes are present, gain a 6-point ward per rank every 5 seconds, lasting 4 seconds. Grants do not stack; absorption and shield-break talents still react.', bonuses: {} },
  { id: 'precision', name: 'Keen Instinct', rarity: 'uncommon', minLevel: 5, maxRank: 2, category: 'weapon',
    description: 'Non-periodic hits, including companions and triggered damage, critically strike every 5/4 hits at rank 1/2. With Killer Instinct, its cadence improves to every 3/2 hits. Critical damage is 1.75×.', bonuses: {} },
  { id: 'venom', name: 'Viper Ink', rarity: 'uncommon', minLevel: 5, maxRank: 2, category: 'weapon',
    description: 'All non-periodic hits, including companions, apply Poison for 2 seconds: 3/5 damage per tick at rank 1/2, or 5/7 with Venom Edge. Stronger effects win; refreshing preserves tick timing.', bonuses: {} },
  { id: 'icebrand', name: 'Wintersteel', rarity: 'uncommon', minLevel: 6, maxRank: 1, category: 'weapon', needs: ['physical'],
    description: 'Non-periodic physical hits, including retaliation and companions, apply 2 seconds of Frost after damage. Later hits can consume it with Frostbreak or Shatterglass. Boss Resolve does not block Frost.', bonuses: {} },
  { id: 'riposte', name: 'Ward Reprisal', rarity: 'uncommon', minLevel: 6, maxRank: 2, category: 'weapon', needs: ['shield'],
    description: 'Absorbing damage retaliates for 8 physical damage per rank to up to 8 foes within 70 range, once per second. Feeds physical/critical interactions without requiring health loss.', bonuses: {} },
  { id: 'catalyst', name: 'Septic Catalyst', rarity: 'rare', minLevel: 8, maxRank: 1, category: 'weapon', needs: ['critical', 'periodic'],
    description: 'Critical hits pulse existing Poison and curses once on up to 3 afflicted foes within 60 range of the victim, including it. Once per 0.75 seconds; pulses cannot crit or refresh durations.', bonuses: {} },
  { id: 'benediction', name: 'Radiant Reprieve', rarity: 'uncommon', minLevel: 6, maxRank: 2, category: 'weapon', needs: ['healing'],
    description: 'Actual healing sends a holy wave for 4 damage per rank to up to 8 foes within 90 range, once per second. Holy marks and spell triggers apply; overhealing cannot trigger it.', bonuses: {} },
  { id: 'frost-pact', name: 'Winter Pact', rarity: 'rare', minLevel: 8, maxRank: 1, category: 'weapon', needs: ['companion', 'slow'],
    description: 'A companion hit against a slowed foe bursts for 8 arcane damage to up to 6 foes within 36 range, once per 0.75 seconds. Frost and snares qualify. Triggers your arcane effects; the burst counts as your triggered damage.', bonuses: {} },
  { id: 'recovery', name: 'Second Wind', rarity: 'common', minLevel: 2, maxRank: MAX_RUN_LEVEL - 1, category: 'survival', fallback: true,
    description: 'Restore 20 health and gain an 8-point ward for 6 seconds. A recovery choice when fewer than three build upgrades remain; does not grant permanent combat stats.', bonuses: {} },

];

export const PROGRESSION_RULES = {
  firstLevelXp: 10,
  extraXpPerLevel: 8,
  offerCount: 3,
  // A bounded run budget; Second Wind fills exhausted or narrow build pools.
  maxLevel: MAX_RUN_LEVEL,
  lateLevelStart: 20,
  lateLevelXpGrowth: 2,
  rarityWeights: { common: 6, uncommon: 3, rare: 1 } satisfies Record<Rarity, number>,
} as const;

/** Clamp run-only rank reads at one boundary, including imported test fixtures. */
export function upgradeRank(ranks: UpgradeRanks, id: UpgradeId): number {
  const value = ranks[id] ?? 0;
  return Number.isFinite(value) ? Math.max(0, Math.min(UPGRADES.find((entry) => entry.id === id)!.maxRank, Math.floor(value))) : 0;
}
