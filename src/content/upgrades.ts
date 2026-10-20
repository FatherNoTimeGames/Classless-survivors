/** Run-only content. Add/tune offers here; selection and combat stay generic. */
export type UpgradeId = 'haste' | 'fork' | 'pierce' | 'burst' | 'fleet' | 'magnet' | 'vitality';
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
export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  rarity: Rarity;
  minLevel: number;
  maxRank: number;
  category: 'weapon' | 'survival' | 'utility';
  bonuses: UpgradeBonuses;
}

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: 'haste', name: 'Quickened Ember', rarity: 'common', minLevel: 2, maxRank: 4, category: 'weapon',
    description: 'Reduce ember cooldown by 0.08 seconds.', bonuses: { attackInterval: -0.08 } },
  { id: 'fleet', name: 'Fleetfoot', rarity: 'common', minLevel: 2, maxRank: 3, category: 'survival',
    description: 'Move faster: +12 movement speed.', bonuses: { moveSpeed: 12 } },
  { id: 'magnet', name: 'Soul Gatherer', rarity: 'common', minLevel: 2, maxRank: 3, category: 'utility',
    description: 'Attract XP shards from farther away: +18 pickup attraction range.', bonuses: { magnetRadius: 18 } },
  { id: 'vitality', name: 'Living Ember', rarity: 'common', minLevel: 2, maxRank: 3, category: 'survival',
    description: 'Gain 12 maximum health and restore 12 health.', bonuses: { maxHealth: 12 } },
  { id: 'fork', name: 'Forked Ember', rarity: 'uncommon', minLevel: 3, maxRank: 2, category: 'weapon',
    description: 'Fire at one additional nearby enemy per attack, when available.', bonuses: { projectileCount: 1 } },
  { id: 'pierce', name: 'Soul Needle', rarity: 'uncommon', minLevel: 3, maxRank: 2, category: 'weapon',
    description: 'Each ember can pass through one additional enemy.', bonuses: { pierce: 1 } },
  { id: 'burst', name: 'Ashburst', rarity: 'rare', minLevel: 4, maxRank: 2, category: 'weapon',
    description: 'Direct ember hits explode for half damage around the target. Each rank adds 20 blast range. Explosions do not chain.', bonuses: { blastRadius: 20 } },
];

export const PROGRESSION_RULES = {
  firstLevelXp: 10,
  extraXpPerLevel: 8,
  offerCount: 3,
  // One rank per level: the entire finite pool fits without an exhausted-offer trap.
  maxLevel: 1 + UPGRADES.reduce((sum, upgrade) => sum + upgrade.maxRank, 0),
  rarityWeights: { common: 6, uncommon: 3, rare: 1 } satisfies Record<Rarity, number>,
} as const;
