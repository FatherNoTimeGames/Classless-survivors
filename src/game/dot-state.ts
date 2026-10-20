import type { DamageSchool } from './events';
import type { Enemy } from './state';
import { TALENT_TUNING as T } from '../content/talent-tuning';

export interface DamageOverTime {
  kind: 'poison' | 'curse'; school: DamageSchool; owner: 'player' | 'companion';
  damage: number; interval: number; remaining: number; tickIn: number;
}

/** One effect per kind. Refreshing preserves its tick clock, so rapid hits never starve ticks. */
export function applyDot(enemy: Enemy, effect: DamageOverTime): void {
  if (![effect.damage, effect.interval, effect.remaining, effect.tickIn].every(Number.isFinite)
    || effect.damage <= 0 || effect.interval < 0.1 || effect.remaining <= 0 || effect.tickIn < 0) return;
  const existing = enemy.dots.find((dot) => dot.kind === effect.kind);
  if (existing) {
    if (effect.damage > existing.damage) {
      existing.damage = effect.damage;
      existing.school = effect.school;
      existing.owner = effect.owner;
    }
    existing.remaining = Math.max(existing.remaining, effect.remaining);
    existing.tickIn = Math.min(existing.tickIn, effect.tickIn);
  } else if (enemy.dots.length < T.maxDots) enemy.dots.push({ ...effect });
}

export function snapshotDots(enemy: Enemy): DamageOverTime[] {
  return enemy.dots.filter((dot) => dot.remaining > 0).map((dot) => ({ ...dot }));
}

/** Count scheduled ticks, including one due exactly at expiration, rather than fractional DPS. */
export function remainingDotDamage(effect: DamageOverTime): number {
  if (effect.remaining <= 0 || effect.tickIn > effect.remaining + 1e-8) return 0;
  const ticks = Math.floor((effect.remaining - effect.tickIn + 1e-8) / effect.interval) + 1;
  return Math.max(0, ticks) * effect.damage;
}
