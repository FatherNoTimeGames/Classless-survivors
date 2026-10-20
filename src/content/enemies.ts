/** Enemy identity/tuning is independent of simulation and rendering. */
export type EnemyKind = 'husk' | 'skitter' | 'archer' | 'charger' | 'hexer';
export type EliteKind = 'none' | 'swift' | 'stout';
export interface EnemyDefinition {
  name: string; health: number; speed: number; contact: number; xp: number;
  keepDistance: number; attackRange: number; warning: number; cooldown: number;
}
export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  husk: { name: 'Grave Husk', health: 18, speed: 30, contact: 12, xp: 5, keepDistance: 0, attackRange: 0, warning: 0, cooldown: 0 },
  skitter: { name: 'Gloom Skitter', health: 12, speed: 53, contact: 8, xp: 5, keepDistance: 0, attackRange: 0, warning: 0, cooldown: 0 },
  archer: { name: 'Bone Archer', health: 32, speed: 24, contact: 8, xp: 8, keepDistance: 115, attackRange: 220, warning: 0.8, cooldown: 2.8 },
  charger: { name: 'Horned Brute', health: 60, speed: 24, contact: 14, xp: 12, keepDistance: 0, attackRange: 190, warning: 0.9, cooldown: 2.6 },
  hexer: { name: 'Mire Hexer', health: 42, speed: 21, contact: 8, xp: 10, keepDistance: 130, attackRange: 220, warning: 1.2, cooldown: 4.2 },
};
export const ELITES = {
  none: { health: 1, speed: 1, damage: 1, xp: 1 },
  swift: { health: 2.5, speed: 1.25, damage: 1.25, xp: 3 },
  stout: { health: 4, speed: 0.85, damage: 1.5, xp: 3 },
} satisfies Record<EliteKind, { health: number; speed: number; damage: number; xp: number }>;
export const ENEMY_ATTACKS = {
  initialDelay: 0.6, stagger: 0.2, staggerSlots: 4,
  keepDistanceOuter: 10, keepDistanceInner: 18, spellMinimumRange: 48,
  maxWindups: 4, maxBolts: 24, maxBlights: 6,
  arrowSpeed: 105, arrowLife: 2.8, arrowDamage: 10, arrowRadius: 3,
  dashSpeed: 210, dashDistance: 150, dashRecovery: 0.75, chargeMinimumRange: 55, dashBonus: 4,
  blightRadius: 24, blightLife: 2, blightDamage: 9, blightSpacing: 64,
} as const;
