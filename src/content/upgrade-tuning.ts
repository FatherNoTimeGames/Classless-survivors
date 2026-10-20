/** Run-only tuning. Timers are seconds, ranges use arena coordinates. */
export const UPGRADE_TUNING = {
  bladeRange: 14, bladeDamage: 4, companionRange: 20, companionDamage: 4,
  periodicDamage: 2, venomDamage: 2,
  wellspringKills: 6, wellspringHeal: 4,
  aegisInterval: 5, aegisAmount: 6, aegisDuration: 4,
  icebrandDuration: 2, riposteDamage: 8, riposteRange: 70, riposteCooldown: 1,
  catalystRange: 60, catalystTargets: 3, catalystCooldown: 0.75,
  benedictionDamage: 4, benedictionRange: 90, benedictionTargets: 8, benedictionCooldown: 1,
  pactDamage: 8, pactRange: 36, pactTargets: 6, pactCooldown: 0.75,
  recoveryHeal: 20, recoveryWard: 8, recoveryDuration: 6,
} as const;
