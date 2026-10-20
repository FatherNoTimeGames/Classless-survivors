import { TALENT_TUNING as T } from './talent-tuning';

/** Companion targeting and attacks share a loop; definitions own their distinct behavior. */
export const COMPANIONS = {
  falcon: { talent: 'falcon', damage: T.falconDamage, interval: T.falconInterval, range: T.falconRange,
    school: 'physical', mode: 'strike', offsetX: -20, offsetY: -24 },
  imp: { talent: 'grim-pact', damage: T.impDamage, interval: T.impInterval, range: T.impRange,
    school: 'fire', mode: 'projectile', offsetX: 20, offsetY: -18 },
} as const;
export type CompanionKind = keyof typeof COMPANIONS;
