/** Tuning for the functioning foundation talents. Descriptions reuse these values. */
export const TALENT_TUNING = {
  points: 6,
  meleeDamage: 16, meleeInterval: 1.1, meleeRange: 50, meleeHalfAngle: Math.PI / 3,
  spellsteelHits: 3, spellsteelDamage: 12, spellsteelRange: 120,
  frostDuration: 2, frostSlow: 0.3, frostbreakDamage: 8, frostbreakStun: 0.6,
  wardAmount: 8, wardDuration: 3, ironWardCooldown: 5,
  lastStandDamage: 20, lastStandRange: 60,
  chainHits: 3, chainDamage: 10, chainRange: 96,
  shatterDamage: 10, shatterRange: 36,
  manaWardHits: 3, riftRefund: 0.15, riftCooldown: 1,
  reprisalDamage: 12, reprisalRange: 44,
  echoHits: 3, echoDamage: 9, echoRange: 96,
  exposedDamage: 6, exposedRefund: 0.15,
  communionKills: 4, communionHeal: 3,
  graceDamage: 6, graceRange: 110,
  cinderKills: 4, cinderDamage: 9, cinderRange: 36,
} as const;
