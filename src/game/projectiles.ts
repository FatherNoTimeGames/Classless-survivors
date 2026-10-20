import type { Point, Run } from './state';
import type { DamageSchool, DamageSource } from './events';
import { RULES } from './rules';

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
    life: RULES.boltLifetime, damage: options.damage, source: options.source, school: options.school,
    pierce: options.pierce ?? 0, blastRadius: options.blastRadius ?? 0, hitIds: options.excludeId === undefined ? [] : [options.excludeId],
  });
  return true;
}
