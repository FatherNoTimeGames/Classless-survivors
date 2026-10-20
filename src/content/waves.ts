import type { EnemyKind } from './enemies';
export const WAVE_RULES = { introAcceleration: 0.012, introMinimumInterval: 1 } as const;
export interface Wave { at: number; name: string; interval: number; health: number; eliteEvery: number; pool: readonly (readonly [EnemyKind, number])[] }
/** Gradual introductions, then bounded escalation. Boss scheduling belongs to task 10. */
export const WAVES: readonly Wave[] = [
  { at: 0, name: 'Restless clearing', interval: 1.2, health: 1, eliteEvery: 0, pool: [['husk', 1]] },
  { at: 18, name: 'Skittering host', interval: 1.0, health: 1, eliteEvery: 0, pool: [['husk', 4], ['skitter', 2]] },
  { at: 35, name: 'Bone volley', interval: 0.9, health: 1, eliteEvery: 0, pool: [['husk', 4], ['skitter', 2], ['archer', 2]] },
  { at: 55, name: 'Horned advance', interval: 0.8, health: 1.15, eliteEvery: 12, pool: [['husk', 4], ['skitter', 2], ['archer', 2], ['charger', 2]] },
  { at: 75, name: 'Blighted ground', interval: 0.72, health: 1.25, eliteEvery: 12, pool: [['husk', 4], ['skitter', 2], ['archer', 2], ['charger', 2], ['hexer', 2]] },
  { at: 120, name: 'Grave tide', interval: 0.65, health: 1.5, eliteEvery: 10, pool: [['husk', 4], ['skitter', 3], ['archer', 2], ['charger', 2], ['hexer', 2]] },
  { at: 240, name: 'Hollow hunt', interval: 0.55, health: 2, eliteEvery: 9, pool: [['husk', 4], ['skitter', 3], ['archer', 3], ['charger', 3], ['hexer', 2]] },
  { at: 420, name: 'Ashen siege', interval: 0.45, health: 2.8, eliteEvery: 8, pool: [['husk', 4], ['skitter', 3], ['archer', 3], ['charger', 3], ['hexer', 3]] },
  { at: 600, name: 'Nightfall legion', interval: 0.36, health: 3.6, eliteEvery: 7, pool: [['husk', 4], ['skitter', 3], ['archer', 3], ['charger', 3], ['hexer', 3]] },
];
export function waveAt(seconds: number): Wave {
  for (let i = WAVES.length - 1; i >= 0; i--) if (seconds >= WAVES[i]!.at) return WAVES[i]!;
  return WAVES[0]!;
}
