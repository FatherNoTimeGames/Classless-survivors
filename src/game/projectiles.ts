import type { Point, Run } from './state';
import type { DamageSchool, DamageSource } from './events';
import { RULES } from './rules';
import { getRunStats } from './stats';
import type { RunStats } from './stats';
import { distance } from './geometry';
import { snapshotEffectContext } from './events';

/** Every projectile snapshots its origin, attribution, and upgrades at launch. */
export function fireBolt(run: Run, origin: Point, target: Point, options: {
  damage: number; source: DamageSource; school: DamageSchool; pierce?: number; blastRadius?: number; excludeId?: number;
}): boolean {
  if (run.bolts.length >= RULES.maxBolts) return false;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const gap = Math.hypot(dx, dy);
  run.bolts.push({
    x: origin.x, y: origin.y, id: run.nextId++,
    vx: gap > 0 ? dx / gap * RULES.boltSpeed : RULES.boltSpeed,
    vy: gap > 0 ? dy / gap * RULES.boltSpeed : 0,
    effectContext: snapshotEffectContext(run.effects),
    // Longer companion targeting ranges must not produce shots that expire before reaching their aim.
    life: Math.max(RULES.boltLifetime, gap / RULES.boltSpeed + RULES.boltArrivalMargin), damage: options.damage, source: options.source, school: options.school,
    pierce: options.pierce ?? 0, blastRadius: options.blastRadius ?? 0, hitIds: options.excludeId === undefined ? [] : [options.excludeId],
  });
  return true;
}

/** Shared inheritance for player, triggered, and companion projectile volleys. */
export function fireVolley(run: Run, origin: Point, center: Point, range: number, options: {
  damage: number; source: DamageSource; school: DamageSchool; excludeId?: number; extraTargets?: number;
}, stats: RunStats = getRunStats(run.progression.ranks)): number {
  const targets = run.enemies.filter((enemy) => enemy.health > 0 && enemy.id !== options.excludeId && distance(enemy, center) <= range)
    .sort((a, b) => distance(a, center) - distance(b, center))
    .slice(0, Math.min(stats.projectileCount + (options.extraTargets ?? 0), RULES.maxBolts - run.bolts.length));
  for (const target of targets) fireBolt(run, origin, target, {
    ...options, pierce: stats.pierce, blastRadius: stats.blastRadius,
  });
  return targets.length;
}
